const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendWelcomeEmail } = require('../lib/mailer');
const { requireAuth } = require('../middleware/authMiddleware');

// Hook from frontend after signup to send email
router.post('/welcome', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  await sendWelcomeEmail(email);
  res.json({ message: 'Welcome email queued' });
});

// Update subscription status
router.post('/subscribe', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_subscribed: true })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Successfully subscribed', profile: data });
});

// Get profile status
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, let's create it (for legacy users)
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({ id: req.user.id, email: req.user.email })
        .select()
        .single();
      
      if (createError) return res.status(400).json({ error: createError.message });
      return res.json(newProfile);
    }

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
