const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');
const axios = require('axios'); // For internal webhook loopback

// 1. Initiate Checkout (Simulation)
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { plan_type } = req.body; // 'monthly' or 'yearly'
  const user_id = req.user.id;
  const session_id = `sess_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Save session
    await supabase.from('payment_sessions').insert([{
      session_id,
      user_id,
      plan_type,
      status: 'pending'
    }]);

    // Set user to pending
    await supabase.from('profiles').update({ subscription_status: 'pending' }).eq('id', user_id);

    // CRITICAL: Simulate Stripe Webhook Delay
    // In production, Stripe calls your webhook after payment success.
    // We simulate this by calling our own /webhook endpoint after 3 seconds.
    setTimeout(async () => {
      try {
        const port = process.env.PORT || 5000;
        await axios.post(`http://localhost:${port}/api/payments/webhook`, {
          type: 'checkout.session.completed',
          data: { session_id, user_id, plan_type }
        });
        console.log(`[MOCK STRIPE] Webhook fired for session: ${session_id}`);
      } catch (err) {
        console.error('[MOCK STRIPE] Webhook simulation failed:', err.message);
      }
    }, 3000);

    res.json({ session_id, status: 'pending', url: `/checkout/processing?session_id=${session_id}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Webhook Handler (Event-Driven)
router.post('/webhook', async (req, res) => {
  const { type, data } = req.body;
  console.log(`[STRIPE WEBHOOK] Received event: ${type}`);

  try {
    if (type === 'checkout.session.completed') {
      const { session_id, user_id, plan_type } = data;

      const startDate = new Date();
      const endDate = new Date();
      if (plan_type === 'monthly') endDate.setDate(startDate.getDate() + 30);
      else endDate.setDate(startDate.getDate() + 365);

      // Update Session
      await supabase.from('payment_sessions').update({ status: 'completed' }).eq('session_id', session_id);

      // ACTIVATE SUBSCRIPTION
      await supabase.from('profiles').update({
        subscription_status: 'active',
        plan_type: plan_type,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        is_subscribed: true // Backward compatibility
      }).eq('id', user_id);
    }

    if (type === 'customer.subscription.deleted') {
      const { user_id } = data;
      await supabase.from('profiles').update({ 
        subscription_status: 'cancelled',
        is_subscribed: false 
      }).eq('id', user_id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// 3. Manual Cancellation
router.post('/cancel-subscription', requireAuth, async (req, res) => {
  try {
    // In real Stripe, you'd call stripe.subscriptions.del()
    // Here we simulate the event loopback
    const port = process.env.PORT || 5000;
    await axios.post(`http://localhost:${port}/api/payments/webhook`, {
      type: 'customer.subscription.deleted',
      data: { user_id: req.user.id }
    });
    res.json({ message: 'Subscription cancelled via event flow' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
