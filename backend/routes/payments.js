const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { requireAuth } = require('../middleware/authMiddleware');
const { DodoPayments } = require('dodopayments');

console.log("KEY:", process.env.DODO_API_KEY);
// ✅ Use ONE correct env variable
const apiKey = (process.env.DODO_API_KEY || '').trim();

if (!apiKey) {
  console.error("❌ DODO_API_KEY is missing in .env");
}

const dodo = new DodoPayments({
  bearerToken: apiKey,
  environment: 'test_mode'
  // ❗ optional: only if required by SDK
});

// ✅ Keep config at top
const PRODUCT_IDS = {
  monthly: 'pdt_0NcvO0h7ZWl4Q50CEtnhz',
  yearly: 'pdt_0NcvO3KQPNmVkAr7havD9'
};



// ============================
// 🚀 CREATE CHECKOUT SESSION
// ============================
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  const { plan_type } = req.body;
  const productId = PRODUCT_IDS[plan_type];

  if (!productId) {
    return res.status(400).json({ error: 'Invalid plan type' });
  }

  try {
    const session = await dodo.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: req.user.email,
        name: req.user.user_metadata?.full_name || "User",
      },
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
      metadata: {
        user_id: req.user.id,
        plan_type: String(plan_type),
      }
    });

    console.log("✅ DODO SESSION CREATED:", session);

    return res.status(200).json({
      checkout_url: session.checkout_url,
    });

  } catch (err) {
    console.error("🔥 DODO FULL ERROR:", JSON.stringify(err, null, 2));

    return res.status(500).json({
      message: err.message,
    });
  }
});



// ============================
// 🔔 WEBHOOK HANDLER
// ============================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = req.body;

    console.log('[DODO WEBHOOK] Event:', payload.type);

    const eventType = payload.type;

    if (
      eventType === 'payment.succeeded' ||
      eventType === 'checkout.session.completed' ||
      eventType === 'subscription.active'
    ) {
      const data = payload.data;

      const user_id = data?.metadata?.user_id;
      const plan_type = data?.metadata?.plan_type;

      if (!user_id || !plan_type) {
        console.warn('⚠️ Missing metadata in webhook');
        return res.json({ received: true });
      }

      const startDate = new Date();
      const endDate = new Date();

      if (plan_type === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
      } else {
        endDate.setMonth(startDate.getMonth() + 1);
      }

      await supabase.from('profiles').update({
        subscription_status: 'active',
        plan_type: plan_type,
        subscription_start_date: startDate.toISOString(),
        subscription_end_date: endDate.toISOString(),
        is_subscribed: true
      }).eq('id', user_id);

      await supabase.from('payment_sessions').update({
        status: 'completed'
      }).eq('session_id', data.checkout_session_id || data.session_id);

      console.log(`✅ Subscription activated for ${user_id}`);
    }

    res.json({ received: true });

  } catch (err) {
    console.error('🔥 WEBHOOK ERROR:', err);
    res.status(500).send('Webhook error');
  }
});



// ============================
// ❌ CANCEL SUBSCRIPTION
// ============================
router.post('/cancel-subscription', requireAuth, async (req, res) => {
  try {
    await supabase.from('profiles').update({
      subscription_status: 'cancelled',
      is_subscribed: false
    }).eq('id', req.user.id);

    res.json({ message: 'Subscription cancelled' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;