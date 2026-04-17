import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Trophy, CreditCard, Activity, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [latestDraw, setLatestDraw] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch everything, but don't crash if stats/draws fail
      const [pRes, dRes, sRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/draws').catch(() => ({ data: [] })),
        api.get('/auth/stats').catch(() => ({ data: { total_prize_pool: 5000, active_players: 0 } }))
      ]);
      
      console.log('DEBUG: Profile Response:', pRes.data);
      console.log('DEBUG: Stats Response:', sRes.data);

      setProfile(pRes.data);
      setStats(sRes.data);
      if (dRes.data && dRes.data.length > 0) {
        setLatestDraw(dRes.data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error('Core Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      await api.post('/auth/subscribe');
      await fetchProfile();
      alert('Subscription active! You can now participate in draws.');
    } catch (err) {
      alert('Error subscribing: ' + err.response?.data?.error || err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;
  if (error) return (
    <div className="p-8 text-center text-red-500">
      <p className="font-bold">Error loading profile data.</p>
      <p className="text-sm mt-2">{error}</p>
      <p className="text-xs mt-4 text-gray-400">If this persists, try signing out and signing up with a new email.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back!</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500">{profile.email}</p>
            {profile.is_subscribed && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {profile.plan_type} PLAN
                </span>
                {profile.subscription_end_date && (
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Renews: {new Date(profile.subscription_end_date).toLocaleDateString()}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        
      </div>

      {!profile.subscription_status || profile.subscription_status === 'free' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="text-yellow-500 w-8 h-8 shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-800 uppercase tracking-tighter">Action Required: Subscribe to Play</h3>
            <p className="text-yellow-700 mt-1 text-sm mb-4 font-medium">You need an active subscription to be eligible for weekly draws and prizes. Choose a plan to support your charity.</p>
            <button 
              onClick={() => navigate('/checkout')}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 uppercase text-xs tracking-widest"
            >
              Get Started (£25/mo)
            </button>
          </div>
        </div>
      ) : profile.subscription_status === 'pending' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          <div>
            <h3 className="text-lg font-bold text-blue-800">Processing Your Payment</h3>
            <p className="text-blue-700 text-sm">We are waiting for the mock Stripe webhook. Your access will be active in ~3 seconds.</p>
          </div>
        </div>
      ) : profile.subscription_status === 'active' ? (
         <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-500">
            {/* Dynamic Community Impact Section */}
            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative border border-emerald-500/30">
              <div className="relative z-10">
                <h3 className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 underline decoration-emerald-400 decoration-2 underline-offset-4">Premium Membership</h3>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-black italic">
                     {profile.user_charities?.[0] 
                        ? (profile.user_charities[0].contribution_pct <= 20 ? '4' : profile.user_charities[0].contribution_pct <= 50 ? '12' : '25')
                        : '1.2k'}
                  </span>
                  <span className="text-emerald-100/80 text-sm font-bold uppercase tracking-widest">
                    {profile.user_charities?.[0]?.charity?.name?.toLowerCase().includes('green') ? 'Trees' : profile.user_charities?.[0]?.charity?.name?.toLowerCase().includes('kids') ? 'Meals' : 'Hours'} Contributed
                  </span>
                </div>
                <div className="mt-6 p-3 bg-emerald-500/30 rounded-2xl backdrop-blur-sm border border-emerald-400/20">
                  <p className="text-emerald-50 text-xs font-bold uppercase tracking-widest">
                     Supporting: {profile.user_charities?.[0]?.charity?.name || 'COMMUNITY FUND'}
                  </p>
                </div>
              </div>
              <Heart className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-400/20" />
            </div>

            {/* Live Jackpot / Prize Pool Section */}
            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between border border-gray-800">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Weekly Jackpot</h3>
                  <div className="group relative">
                    <AlertCircle className="w-4 h-4 text-gray-700 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-white text-gray-900 text-[10px] p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl border border-gray-100">
                      <p className="font-black uppercase tracking-widest mb-1 text-[8px] text-emerald-600">The Math</p>
                      <strong>£5,000 BASE</strong><br/>
                      + £10 FROM EVERY PLAYER SUB.
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-gray-600 text-2xl font-black italic">£</span>
                  <span className="text-6xl font-black text-white tracking-tighter tabular-nums glow-text">
                    {stats?.total_prize_pool ? stats.total_prize_pool.toLocaleString() : '5,000'}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-between items-center text-[10px] font-black tracking-widest text-gray-500">
                <span className="flex items-center gap-2 italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ENTRANTS: {stats?.active_players || 0}
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">LIVE STATUS</span>
              </div>
            </div>
         </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <AlertCircle className="text-red-500 w-8 h-8 shrink-0 mt-1" />
            <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 uppercase tracking-tighter">Subscription {profile.subscription_status}</h3>
                <p className="text-red-700 mt-1 text-sm mb-4 font-medium">Your premium access has expired or was cancelled. Renew now to stay in the draw.</p>
                <button 
                onClick={() => navigate('/checkout')}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition-all shadow-md active:scale-95 uppercase text-xs tracking-widest"
                >
                Renew Subscription
                </button>
            </div>
        </div>
      )}


      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-500"><Activity className="w-6 h-6"/></div>
            <h3 className="font-bold text-lg">My Scores</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">Log up to 5 of your recent golf scores to be used as your lucky numbers in the draw.</p>
          <Link to="/scores" className="text-blue-600 font-medium hover:underline flex items-center gap-1">Manage Scores &rarr;</Link>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gold-50 text-gold-400 rounded-xl"><Trophy className="w-6 h-6 text-gold-400 fill-gold-400/20"/></div>
            <h3 className="font-bold text-lg">Draw Results & Winnings</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">Check past draws, see if your scores matched, and claim your cash prizes.</p>
          <div className="flex gap-4">
             <Link to="/draws" className="text-gold-600 font-medium hover:underline">Past Draws</Link>
             <Link to="/winnings" className="text-gold-600 font-medium hover:underline">My Winnings</Link>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl"><Heart className="w-6 h-6"/></div>
            <h3 className="font-bold text-lg">Charity Impact</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">Select the charity you want to support with your subscription fees.</p>
          <Link to="/charity" className="text-red-600 font-medium hover:underline flex items-center gap-1">Select Charity &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
