const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAdmin } = require('../middleware/authMiddleware');
const { sendDrawResultEmail } = require('../lib/mailer');

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

router.post('/winnings/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('winnings').update({ is_approved: true }).eq('id', id).select();
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
  
  // Create draw
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

  // 2. Fetch all subscribed users' scores
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select(`
      id, email,
      scores (score)
    `)
    .eq('is_subscribed', true);

  if (userError) return res.status(400).json({ error: userError.message });

  // 3. Evaluate each user
  let winnersCount = 0;
  for (const user of users) {
    const userScores = user.scores.map(s => s.score);
    let matched = 0;
    const matchedNumbers = [];

    for (const num of userScores) {
      if (numbers.includes(num)) {
        matched++;
        matchedNumbers.push(num);
      }
    }

    let prize = 0;
    if (matched === 3) prize = 50;  // MVP fixed amounts
    if (matched === 4) prize = 500;
    if (matched === 5) prize = 5000;

    // Record winnings and send email
    await supabase.from('winnings').insert([{
      user_id: user.id,
      draw_id: drawData.id,
      matches: matched,
      matched_numbers: matchedNumbers,
      prize_amount: prize
    }]);

    // Send email async
    sendDrawResultEmail(user.email, matched, prize);

    if (prize > 0) winnersCount++;
  }

  res.json({ message: 'Draw completed successfully', draw: drawData, winners_evaluated: winnersCount });
});

module.exports = router;
