import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Activity, Plus, Trash2 } from 'lucide-react';

export default function Scores() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newScore, setNewScore] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const { data } = await api.get('/scores');
      setScores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [errorStatus, setErrorStatus] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorStatus('');
    try {
      await api.post('/scores', { score: parseInt(newScore), date: newDate });
      setNewScore('');
      await fetchScores();
    } catch (err) {
      setErrorStatus(err.response?.data?.error || 'Failed to add score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      await api.put(`/scores/${id}`, { score: parseInt(editValue) });
      setEditingId(null);
      await fetchScores();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update score');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this score?')) return;
    try {
      await api.delete(`/scores/${id}`);
      await fetchScores();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete score');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Activity className="text-golf-500" />
          My Scores
        </h1>
        <p className="text-gray-500 mt-2">Manage your 5 rolling scores. If you add a 6th score, your oldest date score will be automatically replaced.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Add New Score</h2>
          <form onSubmit={handleAdd} className="mt-4 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Score (1-45)</label>
              <input 
                type="number" min="1" max="45" required
                value={newScore} onChange={e => setNewScore(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-golf-500 outline-none transition-all"
                placeholder="Ex: 32"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date Played</label>
              <input 
                type="date" required
                value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-golf-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit" disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-golf-600 text-white font-bold rounded-xl hover:bg-golf-500 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {submitting ? 'Adding...' : <><Plus className="w-5 h-5"/> Add</>}
            </button>
          </form>
          {errorStatus && (
            <p className="mt-3 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100 italic">
              {errorStatus}
            </p>
          )}
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading scores...</div>
          ) : scores.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex w-16 h-16 bg-gray-100 rounded-full items-center justify-center text-gray-400 mb-4">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Scores Yet</h3>
              <p className="text-gray-500 mt-1">Add your recent golf scores above to participate in draws.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest w-16 text-center">#</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Score</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Date Played</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.map((score, idx) => (
                  <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 text-center text-gray-400 font-medium">{idx + 1}</td>
                    <td className="py-4 px-6">
                      {editingId === score.id ? (
                        <input 
                          type="number" min="1" max="45"
                          value={editValue} onChange={e => setEditValue(e.target.value)}
                          className="w-16 px-2 py-1 border rounded focus:ring-1 focus:ring-golf-500 outline-none"
                        />
                      ) : (
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-golf-100 text-golf-900 font-bold text-lg border border-golf-200">
                          {score.score}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-medium">{new Date(score.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                       {editingId === score.id ? (
                         <>
                           <button 
                             onClick={() => handleEdit(score.id)}
                             className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase"
                           >
                             Save
                           </button>
                           <button 
                             onClick={() => setEditingId(null)}
                             className="text-xs font-bold text-gray-500 hover:text-gray-600 uppercase"
                           >
                             Cancel
                           </button>
                         </>
                       ) : (
                         <>
                           <button 
                             onClick={() => { setEditingId(score.id); setEditValue(score.score); }}
                             className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase"
                           >
                             Edit
                           </button>
                           <button 
                             onClick={() => handleDelete(score.id)}
                             className="text-xs font-bold text-red-600 hover:text-red-700 uppercase"
                           >
                              Delete
                           </button>
                         </>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

