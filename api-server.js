/**
 * La Dolce Vita — API Server (Development Stub)
 * 
 * This is a development stub for all API endpoints.
 * Replace with your actual backend (Node.js/Express, Next.js API routes, etc.)
 * 
 * To run: node api-server.js
 * Requires: npm install express cors body-parser
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- 1. Reservation API ---
app.post('/api/reservations', async (req, res) => {
  const { date, time, partySize, table, name, email, phone, occasion, requests } = req.body;

  // TODO: Replace with actual reservation system (OpenTable, Resy, or custom)
  console.log('New reservation:', req.body);

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  res.json({
    success: true,
    reservationId: `LDV-${Date.now()}`,
    message: 'Reservation confirmed',
    confirmation: {
      date,
      time,
      partySize,
      table,
      name,
      email
    }
  });
});

// --- 2. Newsletter API ---
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;

  // TODO: Replace with Mailchimp, ConvertKit, or Resend
  console.log('Newsletter subscription:', email);

  await new Promise(resolve => setTimeout(resolve, 500));

  res.json({
    success: true,
    message: 'Successfully subscribed to newsletter'
  });
});

// --- 3. Contact Form API ---
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // TODO: Replace with SendGrid, Resend, or email service
  console.log('Contact form submission:', req.body);

  await new Promise(resolve => setTimeout(resolve, 800));

  res.json({
    success: true,
    message: 'Message sent successfully'
  });
});

// --- 4. Stripe Checkout Session ---
app.post('/api/create-checkout-session', async (req, res) => {
  const { items, customer } = req.body;

  // TODO: Replace with actual Stripe integration
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.create({...});

  console.log('Checkout session:', { items, customer });

  await new Promise(resolve => setTimeout(resolve, 1000));

  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  res.json({
    success: true,
    sessionId: `cs_test_${Date.now()}`,
    url: `https://checkout.stripe.com/pay/cs_test_${Date.now()}`,
    amount: total
  });
});

// --- 5. Availability Check (for reservation calendar) ---
app.get('/api/availability', async (req, res) => {
  const { date } = req.query;

  // TODO: Replace with actual availability system
  console.log('Checking availability for:', date);

  await new Promise(resolve => setTimeout(resolve, 300));

  res.json({
    date,
    available: true,
    timeSlots: [
      { time: '17:00', available: true },
      { time: '17:30', available: true },
      { time: '18:00', available: true },
      { time: '18:30', available: false },
      { time: '19:00', available: true },
      { time: '19:30', available: true },
      { time: '20:00', available: true },
      { time: '20:30', available: false },
      { time: '21:00', available: true },
      { time: '21:30', available: true }
    ]
  });
});

// --- 6. Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`La Dolce Vita API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
