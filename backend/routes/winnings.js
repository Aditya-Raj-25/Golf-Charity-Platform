const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('winnings')
    .select(`
      id, amount, proof_url, matches, is_approved,
      draw:draws (run_at, num1, num2, num3, num4, num5)
    `)
    .eq('user_id', req.user.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

router.post('/:id/proof', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { proof_url } = req.body;

  const { data, error } = await supabase
    .from('winnings')
    .update({ proof_url })
    .match({ id, user_id: req.user.id })
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Proof uploaded', winning: data[0] });
});

module.exports = router;
