const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { plan } = req.body; // 'monthly' or 'yearly'
  const user_id = req.user.id;

  let price_id;
  if (plan === 'yearly') {
    price_id = process.env.STRIPE_YEARLY_PRICE_ID;
  } else {
    price_id = process.env.STRIPE_MONTHLY_PRICE_ID;
  }

  if (!price_id) {
    return res.status(400).json({ error: 'Invalid plan or missing Price ID configuration' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?status=success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout?status=cancel`,
      metadata: {
        user_id: user_id,
        plan_type: plan
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stripe/webhook
// Note: This route needs raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { user_id, plan_type } = session.metadata;

    // Update profiles.is_subscribed = true and profiles.plan_type
    const { error } = await supabase
      .from('profiles')
      .update({
        is_subscribed: true,
        plan_type: plan_type,
        subscription_end_date: plan_type === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', user_id);

    if (error) {
      console.error('Error updating profile after subscription:', error);
    } else {
      console.log(`User ${user_id} subscribed to ${plan_type}`);
    }
  }

  res.json({ received: true });
});

module.exports = router;
