import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Trophy, CreditCard, Activity, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
    } catch (err) {
      console.error(err);
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
  if (!profile) return (
    <div className="p-8 text-center text-red-500">
      <p className="font-bold">Error loading profile data.</p>
      <p className="text-sm mt-2">The backend API connection failed. Ensure your VITE_API_URL is configured in your Vercel deployment and the backend is live.</p>
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
              onClick={handleSubscribe}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors shadow-sm"
            >
              Subscribe Now ($10/mo)
            </button>
          </div>
        </div>
      )}

      {profile.is_subscribed && (
         <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <CheckCircle2 className="text-green-500 w-8 h-8 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-green-800">Subscription Active</h3>
              <p className="text-green-700 text-sm">You are eligible for all upcoming draws.</p>
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
