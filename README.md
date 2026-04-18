Golf Charity Platform
A subscription-based web application combining golf performance tracking, charity fundraising, and a monthly draw-based reward engine.
Live Site — https://frontend-lake-zeta-40.vercel.app/
Backend API — https://golf-charity-backend-pku8.onrender.com

What It Does
Users subscribe to the platform, enter their last 5 golf scores in Stableford format (1–45), and those scores become their numbers for a monthly prize draw. A portion of every subscription goes to a charity of the user's choice.

Screenshots

Landing page — hero section with subscribe CTA

<img src = "./images/landing-page.png">

User dashboard — subscription status, scores, charity, winnings overview

<img src = "./images/dashboard.png">

Score entry — rolling 5-score logic with date validation

<img src = "./images/score-entry.png">

Charity selection — contribution percentage slider with impact preview

<img src = "./images/charity-selection.png">

Monthly draw results page

<img src = "./images/monthly-draw.png">

Admin panel — users, draw engine, charities, winner verification, reports

<img src = "./images/admin-panel.png">

Payment 

<img src = "./images/payment.png">
<img src = "./images/payment-2.png">

Tech Stack
LayerTechnologyFrontendReact 18, Vite, Tailwind CSSBackendNode.js, Express.jsDatabaseSupabase (PostgreSQL)AuthSupabase Auth (JWT)PaymentsDodoPayments (test mode)File StorageSupabase StorageEmailSendGridDeploymentVercel (frontend + backend)

Features
Subscription and payments

Monthly and yearly plans
DodoPayments hosted checkout
Webhook-driven subscription activation
Subscription status and renewal date on dashboard

Score management

Enter up to 5 Stableford scores (range 1–45)
Rolling logic — adding a 6th score auto-removes the oldest
One score per date enforced at both database and API level
Users can edit or delete their own scores

Draw engine

Two modes: random draw and algorithmic (weighted by score frequency across all users)
Simulation mode lets admin preview results before publishing
3-match, 4-match, and 5-match prize tiers
Jackpot rollover — if no 5-match winner, the jackpot carries to the next draw

Prize pool

40% of pool to 5-match (jackpot, rolls over if unclaimed)
35% to 4-match
25% to 3-match
Prizes split equally among multiple winners in the same tier

Charity system

Users select a charity at signup
Minimum 10% of subscription fee goes to their chosen charity
Users can increase their contribution percentage voluntarily

Winner verification

Winners upload a screenshot proof of their golf scores
Admin reviews and approves or rejects
Payment status tracked: pending and paid

Admin dashboard

User management — view, edit scores, delete accounts
Draw management — configure mode, simulate, publish
Charity management — add and remove charities
Reports — total users, active subscribers, prize pool distributed, charity contributions, draw history


Database Schema
profiles          — extends Supabase auth, stores subscription status, plan, admin flag
scores            — user scores with UNIQUE(user_id, date) constraint
charities         — charity listings
user_charities    — user charity selection and contribution percentage
draws             — draw records with winning numbers and jackpot carry columns
winnings          — winner records with match count, prize amount, proof URL, payment status
Full schema: supabase/schema.sql

Local Setup
Prerequisites: Node.js 18+, a Supabase project, a DodoPayments account (test mode), a SendGrid account.
1. Clone the repo
bashgit clone https://github.com/Aditya-Raj-25/Golf-Charity-Platform.git
cd Golf-Charity-Platform
2. Set up the database
Run supabase/schema.sql in your Supabase SQL editor.
Create a storage bucket called winner-proofs with public read access in your Supabase dashboard.
3. Backend
bashcd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm start
4. Frontend
bashcd frontend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
Environment variables required
Backend .env:
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DODO_API_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
FRONTEND_URL=
PORT=3001
Frontend .env:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=

Project Structure
Golf/
  backend/
    routes/         — auth, scores, draws, charities, admin, winnings, payments
    middleware/     — requireAuth, requireAdmin, requirePremium
    lib/            — supabase client, mailer
    index.js        — Express app entry point
  frontend/
    src/
      pages/        — Landing, Login, Dashboard, Scores, Charity, Draws, Winnings, Admin, Checkout
      components/   — Layout, ProtectedRoute
      lib/          — API helper, Supabase client
  supabase/
    schema.sql


Author
Aditya Raj