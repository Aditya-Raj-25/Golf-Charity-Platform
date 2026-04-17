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

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">My Community Impact</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">
                 {profile.user_charities?.[0] 
                    ? (profile.user_charities[0].contribution_pct <= 20 ? '4' : profile.user_charities[0].contribution_pct <= 50 ? '12' : '25')
                    : '1.2k'}
              </span>
              <span className="text-emerald-200 text-sm font-medium">
                {profile.user_charities?.[0]?.charity?.name?.toLowerCase().includes('green') ? 'Mangroves' : profile.user_charities?.[0]?.charity?.name?.toLowerCase().includes('kids') ? 'Meals' : 'Hours'} Planted
              </span>
            </div>
            <div className="mt-4">
              <p className="text-emerald-100 text-sm font-medium font-bold">
                Supporting: {profile.user_charities?.[0]?.charity?.name || 'GREEN KEEPERS FUND'}
              </p>
            </div>
          </div>
          <Heart className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-500/20" />
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Live Weekly Jackpot</h3>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-gray-500 text-2xl font-bold">£</span>
              <span className="text-5xl font-black text-emerald-400 tracking-tighter tabular-nums">
                {stats?.total_prize_pool ? stats.total_prize_pool.toLocaleString() : '5,000'}
              </span>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center text-xs font-bold text-gray-500">
            <span>ACTIVE ENTRANTS: <strong className="text-white ml-1">{stats?.active_players || 0}</strong></span>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">JACKPOT GROWING</span>
          </div>
        </div>
      </div>



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
