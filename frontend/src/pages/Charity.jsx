import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Heart, Building, Check } from 'lucide-react';

export default function Charity() {
  const [charities, setCharities] = useState([]);
  const [selectedPct, setSelectedPct] = useState(10);
  const [activeCharityId, setActiveCharityId] = useState(null);
  const [mySelection, setMySelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        api.get('/charities').catch(() => ({ data: [] })),
        api.get('/charities/my-selection').catch(() => ({ data: null }))
      ]);
      
      const cData = cRes.data || [];
      const mData = mRes.data;

      setCharities(cData);
      setMySelection(mData);
      
      if (mData) {
        setActiveCharityId(mData.charity_id);
        setSelectedPct(mData.contribution_pct);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [justSaved, setJustSaved] = useState(false);

  const handleUpdate = async () => {
    if (!activeCharityId) return alert('Please select a charity first');
    setSaving(true);
    setJustSaved(false);
    try {
      await api.post('/charities/select', { 
        charity_id: activeCharityId, 
        contribution_pct: selectedPct 
      });
      await fetchData();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading charities...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-emerald-50 rounded-2xl mb-2">
          <Heart className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Stewardship</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Through the Golf Charity Platform, a portion of your monthly subscription directly supports environmental and social causes. 
          Choose your primary focus and set your contribution level.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* CHARITY LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Available Causes</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {charities.map(charity => {
              const isSelected = activeCharityId === charity.id;
              
              return (
                <div 
                  key={charity.id} 
                  onClick={() => setActiveCharityId(charity.id)}
                  className={`cursor-pointer group p-6 rounded-2xl transition-all duration-200 border-2 ${
                    isSelected ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    <Building className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{charity.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-3">{charity.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* IMPACT CALCULATOR */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white rounded-3xl p-8 sticky top-8 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full" />
              Impact Calculator
            </h2>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-400 text-sm">Contribution Level</span>
                  <span className="text-emerald-400 font-bold">{selectedPct}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={selectedPct}
                  onChange={(e) => setSelectedPct(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <span>Minimum (10%)</span>
                  <span>Full (100%)</span>
                </div>
              </div>

              <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <p className="text-gray-400 text-sm mb-4">Monthly Stewardship Impact</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center font-bold">
                      {Math.floor(selectedPct * 0.4)}
                    </div>
                    <span className="text-sm font-medium">New Mangroves Planted</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center font-bold">
                       {Math.floor(selectedPct * 1.5)}h
                    </div>
                    <span className="text-sm font-medium">Ocean Cleanup Time</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleUpdate}
                disabled={saving || !activeCharityId}
                className="w-full py-4 bg-emerald-500 text-gray-900 font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'UPDATING...' : (mySelection?.charity_id === activeCharityId ? 'SAVE CHANGES' : 'CONFIRM SELECTION')}
              </button>

              <p className="text-center text-[10px] text-gray-500 uppercase font-medium">
                * Based on a standard £25 monthly stewardship fee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
