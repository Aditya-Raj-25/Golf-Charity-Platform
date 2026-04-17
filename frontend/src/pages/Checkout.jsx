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
      
      if (data.checkout_url) {
        // Redirect to Dodo Payments Checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received from server');
      }

    } catch (err) {
      console.error('Checkout Error:', err);
      alert('Failed to start checkout: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6 p-8 bg-white rounded-2xl shadow-xl border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Secured!</h1>
        <p className="text-gray-500">Your subscription is now active. Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Your Plan</h1>
          <p className="text-gray-500 text-lg mb-6">Choose the plan that fits your stewardship goals.</p>
          
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit mb-6">
            <button 
              onClick={() => setPlan('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${plan === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setPlan('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${plan === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Yearly (Save £50)
            </button>
          </div>
          <p className="text-gray-600 font-medium">
            {plan === 'monthly' ? 'Monthly Stewardship — £25.00/mo' : 'Yearly Stewardship — £250.00/yr'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <Heart className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
            <p className="text-sm text-emerald-800 font-medium">
              A minimum of 10% of this fee goes directly to your chosen golf charity.
            </p>
          </div>
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
            <p className="text-sm text-blue-800 font-medium">
              Secure Checkout via Dodo Payments.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 space-y-6 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout</h2>
        
        <div className="grid gap-4">
          <div 
            onClick={() => setPlan('monthly')}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${plan === 'monthly' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900">Monthly Plan</span>
              <span className="text-2xl font-bold text-gray-900">£25</span>
            </div>
            <p className="text-sm text-gray-500">Full access to weekly draws.</p>
          </div>

          <div 
            onClick={() => setPlan('yearly')}
            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${plan === 'yearly' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase">
              Best Value
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900">Yearly Plan</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">£250</span>
                <p className="text-[10px] text-emerald-600 font-bold">SAVE £50/YR</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Year-long impact and entries.</p>
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              REDIRECTING TO DODO...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              GO TO PAYMENT
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-gray-400 uppercase font-medium">
          Secured by Dodo Payments.
        </p>
      </div>

    </div>
  );
}

// Support Icons
function Heart(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>;
}
