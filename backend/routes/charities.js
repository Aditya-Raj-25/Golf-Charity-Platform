const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

router.get('/my-selection', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('user_charities')
    .select('charity_id, contribution_pct')
    .eq('user_id', req.user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // not found
    return res.status(400).json({ error: error.message });
  }
  res.json(data || null);
});

router.post('/select', requireAuth, async (req, res) => {
  const { charity_id, contribution_pct } = req.body;

  if (!charity_id || !contribution_pct) {
    return res.status(400).json({ error: 'Charity ID and contribution percentage are required' });
  }

  if (contribution_pct < 10) {
    return res.status(400).json({ error: 'Minimum contribution is 10%' });
  }


  const { data, error } = await supabase
    .from('user_charities')
    .upsert({ user_id: req.user.id, charity_id, contribution_pct })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

module.exports = router;
