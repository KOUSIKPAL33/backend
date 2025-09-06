const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orders');
const User = require('../models/user');

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // Set this in your .env from Stripe dashboard
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    // You may need to store order details in session metadata or fetch from DB/cache

    // Example: create order (fill all attributes as needed)
    const orderData = {
      userId,
      ordersbyshop: [], // Fill with actual shop/items data
      totalAmount: session.amount_total / 100,
      status: 'pending',
      paymentMethod: 'online',
      paymentStatus: 'completed',
      paymentId: session.payment_intent,
      deliveryLocation: {}, // Fill with actual address data
    };
    await Order.create(orderData);
  }

  res.json({ received: true });
});

module.exports = router;