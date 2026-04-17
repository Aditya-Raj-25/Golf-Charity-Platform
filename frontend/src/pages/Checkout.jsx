import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Lock, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [plan, setPlan] = useState('monthly'); // 'monthly' or 'yearly'
  const navigate = useNavigate();

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await api.post('/payments/create-checkout-session', { plan_type: plan });
      
      // Start polling for active status (simulating waiting for webhook)
      const checkStatus = setInterval(async () => {
        try {
          const { data: profile } = await api.get('/auth/profile');
          if (profile.subscription_status === 'active') {
            clearInterval(checkStatus);
            setSuccess(true);
            setLoading(false);
            setTimeout(() => navigate('/dashboard'), 3000);
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 2000);

      // Timeout if webhook fails (for cleanup)
      setTimeout(() => clearInterval(checkStatus), 30000);

    } catch (err) {
      console.error('Checkout Error:', err);
      alert('Failed to start checkout: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6 p-8 bg-white rounded-3xl shadow-xl border border-emerald-100 animate-in fade-in zoom-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-up-center">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Payment Secured!</h1>
        <p className="text-gray-500">Your mock transaction was successful. We received the webhook event and activated your premium access.</p>
        <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Experience Premium</h1>
          <p className="text-gray-500 text-lg mb-6">Choose a plan to support your favorite charities and enter the weekly draw.</p>
          
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit mb-4">
            <button 
              onClick={() => setPlan('monthly')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${plan === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPlan('yearly')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${plan === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <Heart className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
            <div>
              <p className="text-sm text-emerald-900 font-black uppercase tracking-wider">Charity Impact</p>
              <p className="text-xs text-emerald-700 font-medium">10% of your fee goes directly to your selected golf charity.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <div>
              <p className="text-sm text-blue-900 font-black uppercase tracking-wider">Event-Driven Architecture</p>
              <p className="text-xs text-blue-700 font-medium">We use a mock Stripe architecture to simulate real-world webhooks and subscription states.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 space-y-6 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
            <CreditCard className="w-12 h-12 text-gray-100" />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 mb-2">Checkout</h2>
        
        <div className="grid gap-4">
          <label 
            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${plan === 'monthly' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <input type="radio" name="plan" className="hidden" onClick={() => setPlan('monthly')} />
            <div className="flex justify-between items-center mb-1">
              <span className="font-black text-gray-900 uppercase text-xs tracking-widest">Monthly</span>
              <span className="text-2xl font-black text-gray-900">£25</span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase">Billed every 30 days</p>
          </label>

          <label 
            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all relative ${plan === 'yearly' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <input type="radio" name="plan" className="hidden" onClick={() => setPlan('yearly')} />
            <div className="absolute top-0 right-6 bg-emerald-600 text-white text-[8px] font-black px-3 py-1 rounded-b-lg uppercase tracking-widest">
              Save 16%
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-black text-gray-900 uppercase text-xs tracking-widest">Yearly</span>
              <span className="text-2xl font-black text-gray-900">£250</span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase">Billed every 365 days</p>
          </label>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 mt-4"
        >
          {loading ? (
            <>
              <span className="text-xs animate-pulse">PROCESSING PAYMENT SECURELY...</span>
              <span className="text-[10px] text-gray-400 font-medium">WAITING FOR MOCK WEBHOOK DELAY (3S)</span>
            </>
          ) : (
            <>
              <span className="tracking-widest uppercase">Subscribe Now</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-normal">SECURE MOCK TRANSACTION</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <Lock className="w-3 h-3" />
          SSL Encrypted Simulation
        </div>
      </div>

    </div>
  );
}

}

// Support Icons
function Heart(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}
