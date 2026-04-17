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
      // Filter out winnings with null/missing draw references
      setWinnings((data || []).filter(w => w.draw));
    } catch (err) {
      console.error('Fetch winnings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (file, id) => {
    if (!file) return;
    setUploadingId(id);
    
    const formData = new FormData();
    formData.append('proof', file);

    try {
      await api.post(`/winnings/${id}/proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Proof uploaded successfully! Awaiting admin approval.');
      await fetchWinnings();
    } catch (err) {
      alert('Failed to upload proof. ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusDisplay = (win) => {
    if (win.payment_status === 'paid') return <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px] bg-emerald-50 px-2 py-1 rounded border border-emerald-100 italic">Paid</span>;
    if (win.is_approved && win.payment_status === 'pending') return <span className="text-blue-600 font-bold uppercase tracking-widest text-[10px] bg-blue-50 px-2 py-1 rounded border border-blue-100 italic">Approved — Payment Pending</span>;
    if (win.proof_url) return <span className="text-yellow-600 font-bold uppercase tracking-widest text-[10px] bg-yellow-50 px-2 py-1 rounded border border-yellow-100 italic">Under Review</span>;
    return <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-50 px-2 py-1 rounded border border-gray-100 italic">Pending Proof</span>;
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
          <p className="text-gray-500 mt-2 mb-8">Keep submitting scores and participating in our weekly draws to win!</p>
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
                  <td className="py-4 px-6 text-gray-600">{win.draw?.run_at ? new Date(win.draw.run_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-sm">
                      {win.matches} / 5
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-green-600 text-lg">£{win.prize_amount}</td>
                  <td className="py-4 px-6">
                    {getStatusDisplay(win)}
                  </td>
                  <td className="py-4 px-6">
                    {!win.is_approved && !win.proof_url && (
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            handleUploadProof(file, win.id);
                          }}
                          className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                        {uploadingId === win.id && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                             <div className="w-3 h-3 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                             UPLOADING...
                          </div>
                        )}
                      </div>
                    )}
                    {win.proof_url && (
                       <a href={win.proof_url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700 text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">
                         View Uploaded Proof
                       </a>
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
