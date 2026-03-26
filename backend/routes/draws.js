const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('draws')
    .select('id, run_at, num1, num2, num3, num4, num5')
    .order('run_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data || []);
});

module.exports = router;
