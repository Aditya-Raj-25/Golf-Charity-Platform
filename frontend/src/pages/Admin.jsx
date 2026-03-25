import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, Building, PlayCircle, ShieldCheck } from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [newCharityName, setNewCharityName] = useState('');
  const [newCharityDesc, setNewCharityDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('draw');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [{ data: uData }, { data: cData }, { data: wData }] = await Promise.all([
        api.get('/admin/users'),
        api.get('/charities'),
        api.get('/admin/winnings')
      ]);
      setUsers(uData || []);
      setCharities(cData || []);
      setWinnings(wData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDraw = async () => {
    if (!window.confirm('Are you sure you want to run a new draw? This will evaluate all subscribed users and cannot be undone.')) return;
    
    try {
      const { data } = await api.post('/admin/draw');
      alert(`Draw complete! Numbers: ${data.winning_numbers.join(', ')}. Winners evaluated: ${data.winners_evaluated}`);
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleApproveWinning = async (id) => {
    try {
      await api.post(`/admin/winnings/${id}/approve`);
      await fetchAdminData();
      alert('Winning approved!');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleAddCharity = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/charities', { name: newCharityName, description: newCharityDesc });
      setNewCharityName('');
      setNewCharityDesc('');
      await fetchAdminData();
      alert('Charity added successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <ShieldCheck className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500 mt-1">Manage draws, charities, and verify winners.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        {['draw', 'winnings', 'charities', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold text-sm rounded-t-lg capitalize transition-colors ${
              activeTab === tab ? 'bg-white border-t border-x border-gray-200 text-emerald-600 -mb-px' : 'text-gray-500 hover:bg-gray-50 border border-transparent border-b-0'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-sm border border-gray-200 p-8">
        
        {/* DRAW TAB */}
        {activeTab === 'draw' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Execute Monthly Draw</h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-8">
              Running a draw will generate 5 random numbers (1-45), check all active subscriptions, calculate matches, record winnings, and instantly email results to all participants.
            </p>
            <button 
              onClick={handleRunDraw}
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-colors hover:-translate-y-1"
            >
              START DRAW ENGINE
            </button>
          </div>
        )}

        {/* WINNINGS TAB */}
        {activeTab === 'winnings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Verification Queue</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Winner</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Matches</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Prize</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Proof</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {winnings.map(w => (
                    <tr key={w.id}>
                      <td className="py-4 px-4 font-medium text-gray-900">{w.profile?.email}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{w.matches} Numbers</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">${w.prize_amount}</td>
                      <td className="py-4 px-4">
                        {w.proof_url ? (
                          <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">View Proof</a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not uploaded</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {w.is_approved ? (
                          <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded">Approved</span>
                        ) : (
                          <button 
                            disabled={!w.proof_url}
                            onClick={() => handleApproveWinning(w.id)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                              w.proof_url ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            VERIFY
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {winnings.length === 0 && (
                    <tr><td colSpan="5" className="py-12 text-center text-gray-400 italic">No winnings recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHARITIES TAB */}
        {activeTab === 'charities' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-2"><Building className="w-5 h-5"/> Manage Charities</h2>
            
            <form onSubmit={handleAddCharity} className="bg-gray-50 p-6 rounded-xl border border-gray-200 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Charity Name</label>
                <input required value={newCharityName} onChange={e=>setNewCharityName(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description (Short)</label>
                <input required value={newCharityDesc} onChange={e=>setNewCharityDesc(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
              </div>
              <button type="submit" className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 h-[42px]">Add Charity</button>
            </form>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charities.map(c => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{c.description}</td>
                    <td className="py-3 px-4"><span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-50 rounded-full">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4 mb-4"><Users className="w-5 h-5"/> Platform Users & Subs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Subscription</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Supporting</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{u.email}</td>
                        <td className="py-3 px-4">
                          {u.is_subscribed 
                            ? <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-50 rounded-full">Active</span>
                            : <span className="text-gray-500 text-xs font-bold px-2 py-1 bg-gray-100 rounded-full">Inactive</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-gray-600">
                            {u.user_charities?.[0]?.charities?.name || 'No selection'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_admin 
                            ? <span className="text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded-full border border-red-200">Admin</span>
                            : <span className="text-gray-500 text-sm">User</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
