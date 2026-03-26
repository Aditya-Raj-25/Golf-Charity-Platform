const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendWelcomeEmail, sendLoginEmail } = require('../lib/mailer');
const { requireAuth } = require('../middleware/authMiddleware');

// Hook from frontend after signup to send email
router.post('/welcome', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  sendWelcomeEmail(email); // Fire and forget
  res.json({ message: 'Welcome email queued' });
});

// Diagnostic route for email testing
router.get('/test-email', async (req, res) => {
  const email = req.query.email || 'adityaraj12jan23@gmail.com';
  const result = await sendWelcomeEmail(email);
  res.json({ 
    message: 'Test email result', 
    ...result,
    tip: 'If this says Invalid Login, double check your Gmail App Password and make sure 2FA is on.'
  });
});

// Hook from frontend after login to send notification
router.post('/login-notification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  sendLoginEmail(email); // Fire and forget
  res.json({ message: 'Login notification queued' });
});

// Update subscription status
router.post('/subscribe', requireAuth, async (req, res) => {
  const { plan_type } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      is_subscribed: true,
      plan_type: plan_type || 'monthly'
    })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Successfully subscribed', profile: data });
});

// Update: Include Charity and Stats
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_charities!user_id (
          contribution_pct,
          charity:charity_id (name)
        )
      `)
      .eq('id', req.user.id)
      .single();

    if (pError && pError.code === 'PGRST116') {
      // Auto-create profile if missing
      const { data: newProfile, error: cError } = await supabase
        .from('profiles')
        .upsert({ id: req.user.id, email: req.user.email }, { onConflict: 'id' })
        .select()
        .single();
      if (cError) return res.status(400).json({ error: cError.message });
      return res.json(newProfile);
    }

    if (pError) return res.status(400).json({ error: pError.message });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global Stats for the "Real" feeling
router.get('/stats', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_subscribed', true);

    if (error) throw error;

    const basePrize = 5000;
    const perUser = 25 * 0.40; // 40% of subscription goes to pool
    
    res.json({
      active_players: count || 0,
      total_prize_pool: basePrize + ((count || 0) * perUser),
      last_draw_date: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
