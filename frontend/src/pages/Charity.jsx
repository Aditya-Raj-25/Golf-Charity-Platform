import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Heart, Building, Check } from 'lucide-react';

export default function Charity() {
  const [charities, setCharities] = useState([]);
  const [mySelection, setMySelection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: cData }, { data: mData }] = await Promise.all([
        api.get('/charities'),
        api.get('/charities/my-selection')
      ]);
      setCharities(cData || []);
      setMySelection(mData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (charity_id) => {
    const pct = prompt('Enter contribution percentage (1-100):', mySelection?.contribution_pct || '10');
    if (!pct || isNaN(pct) || pct < 1 || pct > 100) return alert('Invalid percentage');
    
    setSaving(true);
    try {
      await api.post('/charities/select', { charity_id, contribution_pct: parseInt(pct) });
      await fetchData();
      alert('Charity updated successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading charities...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Make an Impact</h1>
        <p className="text-xl text-gray-500 mt-3 max-w-2xl mx-auto">
          Choose where a portion of your subscription fee goes. Support incredible courses and causes through the game you love.
        </p>
      </div>

      {mySelection && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-red-800 uppercase tracking-widest mb-1">Current Support</h2>
            <p className="text-lg font-medium text-red-900 flex items-center gap-2">
              <Check className="w-5 h-5 text-red-500" />
              You are supporting <strong>{charities.find(c => c.id === mySelection.charity_id)?.name}</strong> with a {mySelection.contribution_pct}% contribution.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {charities.map(charity => {
          const isSelected = mySelection?.charity_id === charity.id;
          
          return (
            <div 
              key={charity.id} 
              className={`glass-card rounded-2xl p-6 transition-all duration-200 border-2 ${isSelected ? 'border-red-400 bg-red-50/20 shadow-red-100/50' : 'border-transparent hover:border-gray-200'}`}
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-gray-400">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{charity.name}</h3>
              <p className="text-gray-500 mb-6 min-h-[48px]">{charity.description}</p>
              
              <button
                onClick={() => handleSelect(charity.id)}
                disabled={saving}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  isSelected 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {isSelected ? 'Update Contribution %' : 'Select Charity'}
              </button>
            </div>
          );
        })}
        {charities.length === 0 && (
          <div className="col-span-2 text-center text-gray-500 py-12">
            No charities available at the moment. Admin will add some soon.
          </div>
        )}
      </div>
    </div>
  );
}
