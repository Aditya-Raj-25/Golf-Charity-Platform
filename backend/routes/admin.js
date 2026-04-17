const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { sendDrawResultEmail } = require('../lib/mailer');

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      scores (id, score, date),
      user_charities (
        charity:charity_id (name)
      )
    `);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/charities', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  const { data, error } = await supabase.from('charities').insert([{ name, description }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/charities/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Unlink users first
    await supabase.from('user_charities').delete().eq('charity_id', id);
    // 2. Delete charity
    const { error } = await supabase.from('charities').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete dependent data
    await supabase.from('scores').delete().eq('user_id', id);
    await supabase.from('winnings').delete().eq('user_id', id);
    await supabase.from('user_charities').delete().eq('user_id', id);
    // 2. Delete profile
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/winnings', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('winnings')
    .select(`
      *,
      profile:profiles (email),
      draw:draws (run_at, num1, num2, num3, num4, num5)
    `)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/winnings/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('winnings')
    .update({ is_approved: true })
    .eq('id', id)
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// Helper for Algorithmic Draw
async function generateNumbers(mode = 'random') {
  if (mode === 'algorithmic') {
    const { data: allScores } = await supabase.from('scores').select('score');
    if (!allScores || allScores.length === 0) return generateNumbers('random');

    const counts = {};
    for (const s of allScores) counts[s.score] = (counts[s.score] || 0) + 1;

    let pool = [];
    for (let num = 1; num <= 45; num++) {
      const weight = counts[num] || 0;
      // Each number appears at least once, plus its frequency
      for (let i = 0; i <= weight; i++) pool.push(num);
    }

    const result = [];
    while (result.length < 5) {
      const idx = Math.floor(Math.random() * pool.length);
      const val = pool[idx];
      if (!result.includes(val)) result.push(val);
    }
    return result.sort((a,b) => a - b);
  }

  const numbers = [];
  while(numbers.length < 5) {
    const r = Math.floor(Math.random() * 45) + 1;
    if(numbers.indexOf(r) === -1) numbers.push(r);
  }
  return numbers.sort((a,b) => a - b);
}

// SIMULATION MODE
router.post('/draw/simulate', requireAdmin, async (req, res) => {
  try {
    const { mode } = req.body;
    const numbers = await generateNumbers(mode);
    
    // Calculate Pool
    const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_subscribed', true);
    const subscriptionRevenue = (activeCount || 0) * 25;
    const totalPool = subscriptionRevenue * 0.40; 
    
    // Get Rollover
    const { data: lastDraw } = await supabase.from('draws').select('jackpot_carried_out').order('run_at', { ascending: false }).limit(1);
    const rollover = parseFloat(lastDraw?.[0]?.jackpot_carried_out || 0);

    const currentJackpot = (totalPool * 0.40) + rollover;

    // Fetch players
    const { data: users } = await supabase.from('profiles').select('id, email, scores(score)').eq('is_subscribed', true);
    
    let stats = { match5: 0, match4: 0, match3: 0 };
    for (const user of users) {
      const userScores = [...new Set(user.scores.map(s => s.score))];
      const matched = userScores.filter(s => numbers.includes(s)).length;
      if (matched === 5) stats.match5++;
      else if (matched === 4) stats.match4++;
      else if (matched === 3) stats.match3++;
    }

    res.json({
      winning_numbers: numbers,
      total_pool: totalPool,
      jackpot_carried_in: rollover,
      jackpot: currentJackpot,
      simulated_winners: stats,
      prizes: {
        match5_each: stats.match5 > 0 ? currentJackpot / stats.match5 : 0,
        match4_each: stats.match4 > 0 ? (totalPool * 0.35) / stats.match4 : 0,
        match3_each: stats.match3 > 0 ? (totalPool * 0.25) / stats.match3 : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/draw', requireAdmin, async (req, res) => {
  const { mode } = req.body;
  console.log('--- STARTING DRAW ENGINE --- Mode:', mode);
  
  const numbers = await generateNumbers(mode);
  console.log('Winning Numbers:', numbers);
  
  // 2. Calculate Prize Pool
  const { count: activeCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_subscribed', true);
  const totalPool = (activeCount || 0) * 25 * 0.40; 

  // Get Rollover
  const { data: lastDrawData } = await supabase.from('draws').select('jackpot_carried_out').order('run_at', { ascending: false }).limit(1);
  const rollover = parseFloat(lastDrawData?.[0]?.jackpot_carried_out || 0);
  const currentJackpotPool = (totalPool * 0.40) + rollover;

  // 3. Fetch all subscribed users and their latest scores
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email, scores (score)')
    .eq('is_subscribed', true);

  if (userError) return res.status(400).json({ error: userError.message });

  // 4. Evaluate winners
  const winners = [];
  for (const user of users) {
    const userScores = [...new Set(user.scores.map(s => s.score))];
    const matchedNumbers = userScores.filter(s => numbers.includes(s));
    const matched = matchedNumbers.length;
    if (matched >= 3) {
      winners.push({ user, matched, matchedNumbers });
    }
  }

  const match5 = winners.filter(w => w.matched === 5);
  const match4 = winners.filter(w => w.matched === 4);
  const match3 = winners.filter(w => w.matched === 3);

  // Rollover logic
  const jackpotCarriedOut = match5.length === 0 ? currentJackpotPool : 0;

  // Create draw record
  const { data: drawData, error: drawError } = await supabase
    .from('draws')
    .insert([{
      admin_id: req.user.id,
      num1: numbers[0], num2: numbers[1], num3: numbers[2], num4: numbers[3], num5: numbers[4],
      jackpot_carried_in: rollover,
      jackpot_carried_out: jackpotCarriedOut,
      run_at: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (drawError) return res.status(400).json({ error: drawError.message });

  // Divide pools
  const prize5 = match5.length > 0 ? currentJackpotPool / match5.length : 0;
  const prize4 = match4.length > 0 ? (totalPool * 0.35) / match4.length : 0;
  const prize3 = match3.length > 0 ? (totalPool * 0.25) / match3.length : 0;

  // Record winnings
  for (const w of winners) {
    const prize = w.matched === 5 ? prize5 : w.matched === 4 ? prize4 : prize3;
    await supabase.from('winnings').insert([{
      user_id: w.user.id,
      draw_id: drawData.id,
      matches: w.matched,
      matched_numbers: w.matchedNumbers,
      prize_amount: Math.round(prize * 100) / 100
    }]);
    
    try {
      if (w.user.email) await sendDrawResultEmail(w.user.email, w.matched, Math.round(prize));
    } catch (emailErr) {
      console.error('Email failed:', emailErr.message);
    }
  }

  res.json({ 
    message: 'Draw completed successfully', 
    draw: drawData, 
    winners_evaluated: winners.length,
    winning_numbers: numbers,
    jackpot_carried_out: jackpotCarriedOut
  });
});


// SCORE MANAGEMENT: Admin can edit/delete user scores
router.put('/scores/:id', requireAdmin, async (req, res) => {
  const { score, date } = req.body;
  const { data, error } = await supabase
    .from('scores')
    .update({ score, date })
    .eq('id', req.params.id)
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

router.delete('/scores/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('scores').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/admin/winnings/:id/mark-paid
router.post('/winnings/:id/mark-paid', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('winnings')
    .update({ payment_status: 'paid' })
    .eq('id', id)
    .select();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// GET /api/admin/reports
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    // 1. Total Registered Users
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    // 2. Total Active Users
    const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_subscribed', true);
    
    // 3. Total Prize Pool Ever Distributed
    const { data: prizes } = await supabase.from('winnings').select('prize_amount').eq('is_approved', true);
    const totalPrizeDistributed = prizes?.reduce((sum, w) => sum + parseFloat(w.prize_amount), 0) || 0;
    
    // 4. Total Charity Contributions (Approx based on current active subs)
    const { data: userCharities } = await supabase
      .from('user_charities')
      .select('contribution_pct, user:profiles!inner(is_subscribed)');
    
    const activeContributions = userCharities
      ?.filter(uc => uc.user.is_subscribed)
      ?.reduce((sum, uc) => sum + (25 * uc.contribution_pct / 100), 0) || 0;

    // 5. Total Draws Run
    const { count: totalDraws } = await supabase.from('draws').select('*', { count: 'exact', head: true });
    
    // 6. Last Draw Date
    const { data: lastDraw } = await supabase.from('draws').select('run_at').order('run_at', { ascending: false }).limit(1);
    
    // 7. Winners Breakdown
    const { data: winners } = await supabase.from('winnings').select('matches');
    const breakdown = {
      match5: winners?.filter(w => w.matches === 5).length || 0,
      match4: winners?.filter(w => w.matches === 4).length || 0,
      match3: winners?.filter(w => w.matches === 3).length || 0
    };

    res.json({
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      total_prize_distributed: totalPrizeDistributed,
      total_charity_contributions: activeContributions, // Representing current monthly impact
      total_draws: totalDraws || 0,
      last_draw_date: lastDraw?.[0]?.run_at || null,
      winners_breakdown: breakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

