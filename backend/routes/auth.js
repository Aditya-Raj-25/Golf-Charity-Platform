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
    // 1. Fetch profile as an array first to avoid coercion errors
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id);

    if (fetchError) return res.status(400).json({ error: fetchError.message });

    // 2. If profile exists, return it
    if (profiles && profiles.length > 0) {
      return res.json(profiles[0]);
    }

    // 3. If missing, create it (backfill for legacy users)
    console.log(`Auto-creating profile for missing user: ${req.user.id}`);
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({ id: req.user.id, email: req.user.email })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create profile:', createError);
      return res.status(400).json({ error: createError.message });
    }
    
    res.json(newProfile);
  } catch (err) {
    console.error('Unexpected profile error:', err);
    res.status(500).json({ error: 'Internal server error while fetching profile' });
  }
});

module.exports = router;
