import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Trophy, UploadCloud } from 'lucide-react';

export default function Winnings() {
  const [winnings, setWinnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => {
    fetchWinnings();
  }, []);

  const fetchWinnings = async () => {
    try {
      const { data } = await api.get('/winnings');
      setWinnings(data || []);
    } catch (err) {
      console.error('Fetch winnings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (e, id) => {
    e.preventDefault();
    if (!proofUrl) return;
    setUploadingId(id);
    
    try {
      await api.post(`/winnings/${id}/proof`, { proof_url: proofUrl });
      alert('Proof uploaded successfully! Awaiting admin approval.');
      setProofUrl('');
      await fetchWinnings();
    } catch (err) {
      alert('Failed to upload proof. ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading winnings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Trophy className="w-8 h-8 text-gold-400" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Winnings</h1>
          <p className="text-gray-500 mt-1">Claim your prizes and track your wins.</p>
        </div>
      </div>

      {winnings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No Winnings Yet</h3>
          <p className="text-gray-500 mt-2">Keep submitting scores and participating in our weekly draws to win!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 font-semibold text-gray-500 uppercase text-xs">Date</th>
                <th className="py-4 px-6 font-semibold text-gray-500 uppercase text-xs">Matches</th>
                <th className="py-4 px-6 font-semibold text-gray-500 uppercase text-xs">Prize</th>
                <th className="py-4 px-6 font-semibold text-gray-500 uppercase text-xs">Status</th>
                <th className="py-4 px-6 font-semibold text-gray-500 uppercase text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {winnings.map((win) => (
                <tr key={win.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-600">{new Date(win.draw.run_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">
                      {win.matches} / 5
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-green-600 text-lg">${win.amount}</td>
                  <td className="py-4 px-6">
                    {win.is_approved ? (
                      <span className="text-green-600 font-medium">Approved & Paid</span>
                    ) : win.proof_url ? (
                      <span className="text-yellow-600 font-medium">Under Review</span>
                    ) : (
                      <span className="text-gray-500 font-medium">Pending Proof</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {!win.is_approved && !win.proof_url && (
                      <form onSubmit={(e) => handleUploadProof(e, win.id)} className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Link to winning scorecard"
                          required
                          value={uploadingId === win.id ? proofUrl : ''}
                          onChange={(e) => setProofUrl(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-golf-500 outline-none w-48"
                        />
                        <button
                          type="submit"
                          disabled={uploadingId === win.id}
                          className="px-3 py-2 bg-golf-600 text-white rounded-lg font-medium hover:bg-golf-500 transition-colors flex items-center gap-1"
                        >
                          <UploadCloud className="w-4 h-4" /> Upload
                        </button>
                      </form>
                    )}
                    {win.proof_url && !win.is_approved && (
                       <a href={win.proof_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm font-medium">View Proof</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
