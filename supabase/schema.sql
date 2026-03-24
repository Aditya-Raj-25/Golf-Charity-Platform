-- Run this entire script in your Supabase SQL Editor

-- 1. Create custom tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  is_subscribed BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_charities (
  user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  charity_id UUID REFERENCES public.charities(id) NOT NULL,
  contribution_pct INTEGER NOT NULL CHECK (contribution_pct >= 1 AND contribution_pct <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID REFERENCES public.profiles(id),
  num1 INTEGER NOT NULL,
  num2 INTEGER NOT NULL,
  num3 INTEGER NOT NULL,
  num4 INTEGER NOT NULL,
  num5 INTEGER NOT NULL
);

CREATE TABLE public.winnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  draw_id UUID REFERENCES public.draws(id) NOT NULL,
  matches INTEGER NOT NULL,
  matched_numbers INTEGER[] NOT NULL,
  prize_amount DECIMAL NOT NULL,
  proof_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Setup RLS (Row Level Security) - Basic for MVP
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winnings ENABLE ROW LEVEL SECURITY;

-- Create policies (Allow all for simplistic MVP backend interaction, relying on server auth)
CREATE POLICY "Allow service role full access to profiles" ON public.profiles USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to scores" ON public.scores USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to charities" ON public.charities USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to user_charities" ON public.user_charities USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to draws" ON public.draws USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access to winnings" ON public.winnings USING (true) WITH CHECK (true);

-- 3. Set up triggers for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert initial dummy charities
INSERT INTO public.charities (name, description) VALUES
  ('Golf Fore Kids', 'Supporting youth golf programs'),
  ('Green Keepers Fund', 'Environmental conservation on golf courses'),
  ('Veterans Golf Assoc', 'Helping veterans through golf');
