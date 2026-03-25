import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Lock, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate payment delay
    setTimeout(async () => {
      try {
        await api.post('/auth/subscribe');
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (err) {
        alert('Payment failed: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    }, 1500);
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6 p-8 bg-white rounded-3xl shadow-xl border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Payment Secured!</h1>
        <p className="text-gray-500">Your subscription is now active. Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Complete Subscription</h1>
          <p className="text-gray-500 text-lg font-medium">Monthly Stewardship Plan — £25.00/mo</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <Heart className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
            <p className="text-sm text-emerald-800 font-medium">
              A minimum of 10% of this fee goes directly to your chosen golf charity.
            </p>
          </div>
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <p className="text-sm text-blue-800 font-medium">
              Safe & Secure. We use industry-standard encryption to protect your data.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <span className="font-bold text-gray-900">Payment Details</span>
          <div className="flex gap-2">
             <div className="w-8 h-5 bg-gray-100 rounded" />
             <div className="w-8 h-5 bg-gray-100 rounded" />
             <div className="w-8 h-5 bg-gray-100 rounded" />
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Card Information</label>
            <div className="relative">
              <input 
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                placeholder="4242 4242 4242 4242"
              />
              <CreditCard className="absolute right-4 top-3.5 w-5 h-5 text-gray-300" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="MM / YY" />
              <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="CVC" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cardholder Name</label>
            <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John Doe" />
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                PROCESSING...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                PAY £25.00 NOW
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-gray-400 uppercase font-medium">
            Your card will be charged monthly. Cancel anytime in settings.
          </p>
        </form>
      </div>
    </div>
  );
}

// Support Icons
function Heart(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}
