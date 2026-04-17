import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Building, PlayCircle, ShieldCheck, Trash2, Users, Check } from 'lucide-react';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [newCharityName, setNewCharityName] = useState('');
  const [newCharityDesc, setNewCharityDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('draw');
  const [simResults, setSimResults] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [submittingCharity, setSubmittingCharity] = useState(false);
  const [runningDraw, setRunningDraw] = useState(false);
  const [editingUserScores, setEditingUserScores] = useState(null); // { userEmail, scores }
  const [successMsg, setSuccessMsg] = useState('');
  const [drawMode, setDrawMode] = useState('random'); // 'random' or 'algorithmic'
  const [reportsData, setReportsData] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const { data } = await api.get('/admin/reports');
      setReportsData(data);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoadingReports(false);
    }
  };

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
    
    setRunningDraw(true);
    try {
      const { data } = await api.post('/admin/draw', { mode: drawMode });
      setSuccessMsg(`Draw complete! Winning Numbers: ${data.winning_numbers.join(', ')}`);
      setSimResults(null);
      await fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setRunningDraw(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data } = await api.post('/admin/draw/simulate', { mode: drawMode });
      setSimResults(data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSimulating(false);
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

  const handleMarkPaid = async (id) => {
    try {
      await api.post(`/admin/winnings/${id}/mark-paid`);
      await fetchAdminData();
      alert('Payment marked as paid!');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleAddCharity = async (e) => {
    e.preventDefault();
    if (submittingCharity) return;
    setSubmittingCharity(true);
    try {
      await api.post('/admin/charities', { name: newCharityName, description: newCharityDesc });
      setNewCharityName('');
      setNewCharityDesc('');
      await fetchAdminData();
      setSuccessMsg('Charity added successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSubmittingCharity(false);
    }
  };

  const handleDeleteCharity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this charity?')) return;
    try {
      await api.delete(`/admin/charities/${id}`);
      await fetchAdminData();
      setSuccessMsg('Charity deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleEditScore = async (scoreId, newScore, newDate) => {
    try {
      await api.put(`/admin/scores/${scoreId}`, { score: newScore, date: newDate });
      const updatedScores = editingUserScores.scores.map(s => s.id === scoreId ? {...s, score: newScore, date: newDate} : s);
      setEditingUserScores({...editingUserScores, scores: updatedScores});
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteScore = async (scoreId) => {
    if (!window.confirm('Delete this score?')) return;
    try {
      await api.delete(`/admin/scores/${scoreId}`);
      setEditingUserScores({...editingUserScores, scores: editingUserScores.scores.filter(s => s.id !== scoreId)});
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This will remove all their scores and winnings.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchAdminData();
      setSuccessMsg('User deleted successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {successMsg && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-bottom-8 fade-in flex items-center gap-3 border border-emerald-500/20">
          <Check className="w-6 h-6" />
          <span className="font-bold text-lg">{successMsg}</span>
        </div>
      )}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <ShieldCheck className="w-8 h-8 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500 mt-1">Manage draws, charities, and verify winners.</p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        {['draw', 'winnings', 'charities', 'users', 'reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-bold text-[10px] uppercase tracking-widest rounded-t-xl transition-all ${
              activeTab === tab ? 'bg-white border-t border-x border-gray-200 text-emerald-600 -mb-px shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'text-gray-400 hover:text-gray-600 border border-transparent border-b-0'
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
            <div className="flex justify-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit mx-auto mb-8">
              <button 
                onClick={() => setDrawMode('random')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${drawMode === 'random' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Random Mode
              </button>
              <button 
                onClick={() => setDrawMode('algorithmic')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${drawMode === 'algorithmic' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Algorithmic Mode
              </button>
            </div>

            <div className="flex justify-center gap-4">
              <button 
                onClick={handleSimulate}
                disabled={simulating}
                className="px-8 py-4 bg-gray-100 text-gray-900 text-lg font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {simulating ? 'SIMULATING...' : 'RUN SIMULATION'}
              </button>
              <button 
                onClick={handleRunDraw}
                disabled={runningDraw}
                className="px-8 py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-colors hover:-translate-y-1 disabled:opacity-50"
              >
                {runningDraw ? 'EXECUTING...' : 'START DRAW ENGINE'}
              </button>
            </div>

            {simResults && (
              <div className="mt-12 bg-gray-50 rounded-2xl p-8 border border-gray-200 text-left animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Simulation Results (Dry Run)</h3>
                  <div className="flex gap-2">
                    {simResults.winning_numbers.map((n, i) => (
                      <span key={i} className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Pool Contributions</p>
                    <p className="text-xl font-black text-gray-900">£{simResults.total_pool.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-gray-100 italic">
                    <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">+ Carried Jackpot</p>
                    <p className="text-xl font-black text-emerald-600/60">£{simResults.jackpot_carried_in?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 bg-emerald-600 rounded-xl text-white shadow-md">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-100">Total Match-5 Jackpot</p>
                    <p className="text-xl font-black">£{Math.round(simResults.jackpot).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Winners</p>
                    <p className="text-xl font-black text-gray-900">
                      {Object.values(simResults.simulated_winners).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                </div>


                <div className="mt-6 space-y-3">
                  <div className="flex justify-between p-3 bg-white rounded-lg text-sm">
                    <span className="text-gray-500">5 Matches ({simResults.simulated_winners.match5} winners)</span>
                    <span className="font-bold text-emerald-600">£{Math.round(simResults.prizes.match5_each).toLocaleString()} each</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg text-sm">
                    <span className="text-gray-500">4 Matches ({simResults.simulated_winners.match4} winners)</span>
                    <span className="font-bold">£{Math.round(simResults.prizes.match4_each).toLocaleString()} each</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-lg text-sm">
                    <span className="text-gray-500">3 Matches ({simResults.simulated_winners.match3} winners)</span>
                    <span className="font-bold">£{Math.round(simResults.prizes.match3_each).toLocaleString()} each</span>
                  </div>
                </div>
              </div>
            )}
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
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Payment</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Proof</th>
                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {winnings.map(w => (
                    <tr key={w.id}>
                      <td className="py-4 px-4 font-medium text-gray-900">{w.profile?.email}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{w.matches} Numbers</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">£{w.prize_amount}</td>
                      <td className="py-4 px-4">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${w.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                           {w.payment_status}
                         </span>
                      </td>
                      <td className="py-4 px-4">
                        {w.proof_url ? (
                          <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-[10px] font-bold uppercase tracking-widest">View</a>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!w.is_approved ? (
                            <button 
                              disabled={!w.proof_url}
                              onClick={() => handleApproveWinning(w.id)}
                              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-all ${
                                w.proof_url ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Approve
                            </button>
                          ) : w.payment_status !== 'paid' ? (
                            <button 
                              onClick={() => handleMarkPaid(w.id)}
                              className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">Settled</span>
                          )}
                        </div>
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
              <button 
                type="submit" 
                disabled={submittingCharity}
                className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 h-[42px] disabled:opacity-50"
              >
                {submittingCharity ? 'ADDING...' : 'Add Charity'}
              </button>
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
                    <td className="py-3 px-4 flex items-center justify-between">
                      <span className="text-green-600 text-xs font-bold px-2 py-1 bg-green-50 rounded-full">Active</span>
                      <button 
                        onClick={() => handleDeleteCharity(c.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
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
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Score Mgmt</th>
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
                            {u.user_charities?.[0]?.charity?.name || 'No selection'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_admin 
                            ? <span className="text-red-600 text-xs font-bold px-2 py-1 bg-red-50 rounded-full border border-red-200">Admin</span>
                            : <span className="text-gray-500 text-sm">User</span>}
                        </td>
                        <td className="py-3 px-4 flex items-center gap-4">
                          <button 
                            onClick={() => setEditingUserScores({ email: u.email, scores: u.scores || [] })}
                            className="text-blue-600 hover:underline text-xs font-bold"
                          >
                            Edit Scores
                          </button>
                          {!u.is_admin && (
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-4">Platform Insights</h2>
            
            {loadingReports ? (
              <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">
                Generating Reports...
              </div>
            ) : reportsData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">User base</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-black text-gray-900">{reportsData.total_users}</p>
                      <p className="text-xs text-gray-500 font-medium">Registered Users</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-600">{reportsData.active_users}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Active Subs</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-600 rounded-3xl text-white shadow-lg overflow-hidden relative">
                   <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2 relative z-10">Financial Impact</p>
                   <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-3xl font-black">£{reportsData.total_prize_distributed.toLocaleString()}</p>
                      <p className="text-xs text-emerald-100 font-medium tracking-tight">Prizes Distributed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-200">£{reportsData.total_charity_contributions.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-200 font-bold uppercase">Charity/mo</p>
                    </div>
                  </div>
                  <ShieldCheck className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
                </div>

                <div className="p-6 bg-gray-900 rounded-3xl text-white shadow-lg">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Draw Stats</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-black">{reportsData.total_draws}</p>
                      <p className="text-xs text-gray-500 font-medium">Draws Run</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Last Draw</p>
                      <p className="text-xs font-bold text-emerald-400">{reportsData.last_draw_date ? new Date(reportsData.last_draw_date).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 p-8 bg-white rounded-3xl border border-gray-100 shadow-xl mt-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b pb-4">Winners Breakdown (All-Time)</h3>
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl">5</div>
                      <p className="text-2xl font-black text-gray-900">{reportsData.winners_breakdown.match5}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Jackpot Winners</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl">4</div>
                      <p className="text-2xl font-black text-gray-900">{reportsData.winners_breakdown.match4}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Tier 2 Winners</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl">3</div>
                      <p className="text-2xl font-black text-gray-900">{reportsData.winners_breakdown.match3}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Tier 3 Winners</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-red-400 font-bold uppercase tracking-widest">
                Failed to load reports.
              </div>
            )}
          </div>
        )}
      </div>


      {/* SCORE EDIT MODAL */}
      {editingUserScores && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Manage Scores</h3>
                <p className="text-xs text-gray-500">{editingUserScores.email}</p>
              </div>
              <button 
                onClick={() => setEditingUserScores(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editingUserScores.scores.length === 0 ? (
                <p className="text-center py-8 text-gray-400 italic">No scores logged for this user.</p>
              ) : (
                editingUserScores.scores.map(s => (
                  <div key={s.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <input 
                      type="number" 
                      defaultValue={s.score}
                      onBlur={(e) => handleEditScore(s.id, parseInt(e.target.value), s.date)}
                      className="w-16 px-2 py-2 rounded-lg border border-gray-200 text-center font-bold"
                    />
                    <input 
                      type="date" 
                      defaultValue={s.date}
                      onBlur={(e) => handleEditScore(s.id, s.score, e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <button 
                      onClick={() => handleDeleteScore(s.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

