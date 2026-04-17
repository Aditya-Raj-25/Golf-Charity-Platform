const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

router.post('/', requireAuth, async (req, res) => {
  const { score, date } = req.body;
  if (!score || score < 1 || score > 45 || !date) {
    return res.status(400).json({ error: 'Invalid score or date' });
  }

  // Check if score already exists for this date
  const { data: existingScore, error: checkErr } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('date', date)
    .maybeSingle();

  if (checkErr) return res.status(400).json({ error: checkErr.message });
  if (existingScore) {
    return res.status(400).json({ error: "A score already exists for this date. Please edit the existing entry instead." });
  }

  // Enforce Max 5: get current count
  const { data: scores, error: countErr } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true });

  if (countErr) return res.status(400).json({ error: countErr.message });

  // If >= 5, delete the oldest
  if (scores && scores.length >= 5) {
    const idsToDelete = scores.slice(0, scores.length - 4).map(s => s.id);
    await supabase.from('scores').delete().in('id', idsToDelete);
  }

  const { data, error } = await supabase
    .from('scores')
    .insert([{ user_id: req.user.id, score, date }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Score added successfully', score: data[0] });
});

// Update score
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  if (!score || score < 1 || score > 45) {
    return res.status(400).json({ error: 'Invalid score value' });
  }

  const { data, error } = await supabase
    .from('scores')
    .update({ score })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Score not found or unauthorized' });

  res.json({ message: 'Score updated successfully', score: data[0] });
});

// Delete score
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Score deleted successfully' });
});


module.exports = router;
