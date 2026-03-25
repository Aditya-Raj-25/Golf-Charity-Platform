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
        winning_numbers: [7, 14, 21, 28, 35],
        jackpot_amount: 5000,
        winners_evaluated: true
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
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post('/charities', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  const { data, error } = await supabase.from('charities').insert([{ name, description }]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
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

router.post('/draw', requireAdmin, async (req, res) => {
  // 1. Generate 5 unique random numbers (1-45)
  const numbers = [];
  while(numbers.length < 5) {
    const r = Math.floor(Math.random() * 45) + 1;
    if(numbers.indexOf(r) === -1) numbers.push(r);
  }
  
  // Create draw record
  const { data: drawData, error: drawError } = await supabase
    .from('draws')
    .insert([{
      admin_id: req.user.id,
      num1: numbers[0],
      num2: numbers[1],
      num3: numbers[2],
      num4: numbers[3],
      num5: numbers[4]
    }])
    .select()
    .single();

  if (drawError) return res.status(400).json({ error: drawError.message });

  // 2. Fetch all subscribed users and their latest 5 scores
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select(`
      id, email,
      scores (score)
    `)
    .eq('is_subscribed', true);

  if (userError) return res.status(400).json({ error: userError.message });

  // 3. Evaluate each user against the draw
  let winnersCount = 0;
  for (const user of users) {
    // Only use unique scores for matching (PRD implies matching specific numbers)
    const userScores = [...new Set(user.scores.map(s => s.score))];
    let matchedNumbers = userScores.filter(s => numbers.includes(s));
    let matched = matchedNumbers.length;

    let prize = 0;
    if (matched === 3) prize = 50;  
    if (matched === 4) prize = 500;
    if (matched === 5) prize = 5000;

    if (prize > 0) {
      // Record winnings
      await supabase.from('winnings').insert([{
        user_id: user.id,
        draw_id: drawData.id,
        matches: matched,
        matched_numbers: matchedNumbers,
        prize_amount: prize
      }]);

      // Send email alert
      sendDrawResultEmail(user.email, matched, prize);
      winnersCount++;
    }
  }

  res.json({ 
    message: 'Draw completed successfully', 
    draw: drawData, 
    winners_evaluated: winnersCount,
    winning_numbers: numbers 
  });
});

module.exports = router;
