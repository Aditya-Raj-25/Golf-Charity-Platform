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
          <p className="text-gray-500 mt-1">{profile.email}</p>
        </div>
        
      </div>

      {!profile.is_subscribed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <AlertCircle className="text-yellow-500 w-8 h-8 shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-800">Action Required: Subscribe to Play</h3>
            <p className="text-yellow-700 mt-1 text-sm mb-4">You need an active subscription to be eligible for weekly draws and prizes.</p>
            <button 
              onClick={() => navigate('/checkout')}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              Subscribe Now (£25/mo)
            </button>
          </div>
        </div>
      )}

      {profile.is_subscribed && (
         <div className="grid md:grid-cols-2 gap-6">
            {/* Dynamic Community Impact Section */}
            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">My Community Impact</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                     {profile.user_charities?.[0] 
                        ? (profile.user_charities[0].contribution_pct <= 20 ? '4' : profile.user_charities[0].contribution_pct <= 50 ? '12' : '25')
                        : '0'}
                  </span>
                  <span className="text-emerald-200 text-sm font-medium">
                    {profile.user_charities?.[0]?.charities?.name?.includes('Green') ? 'Mangroves' : profile.user_charities?.[0]?.charities?.name?.includes('Kids') ? 'Meals' : 'Hours'} Planted
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-emerald-100 text-sm font-medium">
                    Supporting: <span className="font-bold text-white uppercase ml-1">
                      {profile.user_charities?.[0]?.charities?.name || 'Selected Cause'}
                    </span>
                  </p>
                  <p className="text-emerald-200/60 text-[10px] mt-1 italic font-bold">
                    AT {profile.user_charities?.[0]?.contribution_pct || 10}% CONTRIBUTION LEVEL
                  </p>
                </div>
              </div>
              <Heart className="absolute -bottom-4 -right-4 w-32 h-32 text-emerald-500/20" />
            </div>

            {/* Live Jackpot / Prize Pool Section */}
            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
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
