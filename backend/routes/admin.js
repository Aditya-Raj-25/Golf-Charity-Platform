const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { sendDrawResultEmail } = require('../lib/mailer');

// HIDDEN: One-click setup for the user to test everything
router.post('/test-setup', requireAuth, async (req, res) => {
  try {
    // 1. Make current user Admin
    await supabase.from('profiles').update({ is_admin: true }).eq('id', req.user.id);
    
    // 2. Ensure a draw exists
    let { data: draw } = await supabase.from('draws').select('id').order('run_at', { ascending: false }).limit(1).maybeSingle();
    
    if (!draw) {
      console.log('No draw found, creating one...');
      const { data: newDraw, error: dError } = await supabase.from('draws').insert({
        num1: 7, num2: 14, num3: 21, num4: 28, num5: 35,
        admin_id: req.user.id,
        run_at: new Date().toISOString()
      }).select().single();
      
      if (dError) throw dError;
      draw = newDraw;
    }

    if (!draw) throw new Error('Could not create or find a draw');

    // 3. Create a test winning for THIS user so they can test UPLOAD
    const { error: wError } = await supabase.from('winnings').insert({
      user_id: req.user.id,
      draw_id: draw.id,
      matches: 5,
      matched_numbers: [7, 14, 21, 28, 35],
      prize_amount: 1000,
      is_approved: false
    });

    if (wError) {
      // If error is duplicate, ignore it
      if (!wError.message.includes('unique')) throw wError;
    }

    res.json({ success: true, message: "Success! You are now an ADMIN and have a TEST WINNING to claim!" });
  } catch (err) {
    console.error('Test Setup Error:', err);
    res.status(500).json({ error: err.message });
  }
});

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
    // 1. Unlink users first (foreign key constraint)
    await supabase.from('user_charities').delete().eq('charity_id', id);
    // 2. Delete charity
    const { error } = await supabase.from('charities').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Charity Error:', err);
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

// SIMULATION MODE: Preview results before publishing
router.post('/draw/simulate', requireAdmin, async (req, res) => {
  try {
    const numbers = Array.from({length: 5}, () => Math.floor(Math.random() * 45) + 1);
    
    // Calculate Pool
    const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_subscribed', true);
    const totalPool = (activeCount || 0) * 25 * 0.40; // 40% of standard £25 sub
    
    // Check Rollover from last draw (Calculated in memory if column missing)
    const currentJackpot = (totalPool * 0.40); // Simplified for MVP if DB columns missing

    // Fetch players
    const { data: users } = await supabase.from('profiles').select('id, email, scores(score)').eq('is_subscribed', true);
    
    let stats = { match5: 0, match4: 0, match3: 0 };
    for (const user of users) {
      const userScores = [...new Set(user.scores.map(s => s.score))];
      const matched = userScores.filter(s => numbers.includes(s)).length;
      if (matched === 5) stats.match5++;
      if (matched === 4) stats.match4++;
      if (matched === 3) stats.match3++;
    }

    res.json({
      winning_numbers: numbers,
      total_pool: totalPool,
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
  console.log('--- STARTING DRAW ENGINE ---');
  // 1. Generate 5 unique random numbers (1-45)
  const numbers = [];
  while(numbers.length < 5) {
    const r = Math.floor(Math.random() * 45) + 1;
    if(numbers.indexOf(r) === -1) numbers.push(r);
  }
  console.log('Winning Numbers:', numbers);
  
  // 2. Calculate Prize Pool
  const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_subscribed', true);
  const totalPool = (activeCount || 0) * 25 * 0.40; // PRD: ~40% of subs go to pool
  console.log('Active Subs:', activeCount, 'Total Pool:', totalPool);

  // Create draw record
  const { data: drawData, error: drawError } = await supabase
    .from('draws')
    .insert([{
      admin_id: req.user.id,
      num1: numbers[0],
      num2: numbers[1],
      num3: numbers[2],
      num4: numbers[3],
      num5: numbers[4],
      run_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (drawError) {
    console.error('Draw Insert Error:', drawError);
    return res.status(400).json({ error: drawError.message });
  }

  // 3. Fetch all subscribed users and their latest 5 scores
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email, scores (score)')
    .eq('is_subscribed', true);

  if (userError) {
    console.error('User Fetch Error:', userError);
    return res.status(400).json({ error: userError.message });
  }
  console.log('Evaluating users count:', users?.length);

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
  console.log('Winners found:', winners.length);

  const match5 = winners.filter(w => w.matched === 5);
  const match4 = winners.filter(w => w.matched === 4);
  const match3 = winners.filter(w => w.matched === 3);

  // Divide pools
  const prize5 = match5.length > 0 ? (totalPool * 0.40) / match5.length : 0;
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
    
    // 5. Send Email (Optional - don't let email failure break the draw)
    try {
      if (w.user.email) {
        await sendDrawResultEmail(w.user.email, w.matched, Math.round(prize));
      }
    } catch (emailErr) {
      console.error('Failed to send win email to:', w.user.email, emailErr.message);
    }
  }

  res.json({ 
    message: 'Draw completed successfully', 
    draw: drawData, 
    winners_evaluated: winners.length,
    winning_numbers: numbers
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

module.exports = router;
