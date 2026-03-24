import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Calendar, UserCheck } from 'lucide-react';

export default function Draws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const { data } = await api.get('/draws');
      setDraws(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading draws...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-8">
        <Calendar className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Past Draws</h1>
          <p className="text-gray-500 mt-1">Winning numbers for all previous weekly draws.</p>
        </div>
      </div>

      <div className="space-y-4">
        {draws.map(draw => (
          <div key={draw.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Draw Date</p>
                <p className="font-bold text-lg text-gray-900">
                  {new Date(draw.run_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                </p>
             </div>
             
             <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Winning Numbers</p>
                <div className="flex gap-2 justify-center">
                  {[draw.num1, draw.num2, draw.num3, draw.num4, draw.num5].map((num, i) => (
                    <div key={i} className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md border border-gold-300">
                      {num}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ))}

        {draws.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
             <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-gray-600">No Draws Yet</h3>
          </div>
        )}
      </div>
    </div>
  );
}
