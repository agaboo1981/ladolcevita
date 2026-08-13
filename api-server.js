
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`
];

const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllOrigins = envOrigins.includes('*');
const siteUrl = (process.env.SITE_URL || '').trim();
let siteOrigin = '';

if (siteUrl) {
  try {
    siteOrigin = new URL(siteUrl).origin;
  } catch {
    siteOrigin = '';
  }
}

const allowedOrigins = new Set([
  ...defaultOrigins,
  ...envOrigins.filter((origin) => origin !== '*'),
  ...(siteOrigin ? [siteOrigin] : [])
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowAllOrigins || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '1mb' }));

// Simple In-Memory Rate Limiting
const rateLimit = (limit, windowMs) => {
  const ips = new Map();
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const clientData = ips.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + windowMs;
    } else {
      clientData.count += 1;
    }

    ips.set(ip, clientData);

    if (clientData.count > limit) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
      return;
    }
    next();
  };
};

const apiLimiter = rateLimit(30, 60 * 1000); // 30 requests per minute per IP
app.use('/api/', apiLimiter);

// Secure Server-Side Menu Prices
const MENU_PRICES = {
  'tagliatelle-al-tartufo': 38.00,
  'lasagna-alla-bolognese': 32.00,
  'branzino-al-cartoccio': 44.00,
  'tiramisu-classico': 18.00
};

const isEmail = (value) => typeof value === 'string' && /.+@.+\..+/.test(value.trim());
const isNonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildOrderId = () => `LDV-ORD-${Date.now()}`;
const buildReservationId = () => `LDV-RSV-${Date.now()}`;

app.post('/api/reservations', async (req, res) => {
  const { date, time, partySize, name, email, phone, requests } = req.body || {};

  if (!isNonEmpty(date) || !isNonEmpty(time) || !isNonEmpty(name) || !isEmail(email) || !isNonEmpty(phone)) {
    res.status(400).json({
      success: false,
      message: 'Please provide valid reservation details.'
    });
    return;
  }

  const guestCount = Number(partySize);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    res.status(400).json({
      success: false,
      message: 'Party size must be between 1 and 20 guests.'
    });
    return;
  }

  await delay(450);

  res.json({
    success: true,
    reservationId: buildReservationId(),
    message: 'Reservation request received. Confirmation sent to your email.',
    reservation: {
      date,
      time,
      partySize: guestCount,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      requests: isNonEmpty(requests) ? requests.trim() : ''
    }
  });
});

app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body || {};

  if (!isEmail(email)) {
    res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.'
    });
    return;
  }

  await delay(300);

  res.json({
    success: true,
    message: 'You are subscribed. Thank you for joining our newsletter.'
  });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body || {};

  if (!isNonEmpty(name) || !isEmail(email) || !isNonEmpty(message)) {
    res.status(400).json({
      success: false,
      message: 'Name, email, and message are required.'
    });
    return;
  }

  await delay(350);

  res.json({
    success: true,
    message: 'Your message has been sent. We will get back to you shortly.',
    contact: {
      name: name.trim(),
      email: email.trim(),
      phone: isNonEmpty(phone) ? phone.trim() : '',
      message: message.trim()
    }
  });
});

app.post('/api/create-checkout-session', async (req, res) => {
  const { items, customer } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Your cart is empty.'
    });
    return;
  }

  const hasInvalidItem = items.some((item) => {
    const qty = Number(item.qty);
    const resolvedPrice = MENU_PRICES[item.id];
    return !isNonEmpty(item.name) || !Number.isFinite(qty) || qty < 1 || typeof resolvedPrice !== 'number';
  });

  if (hasInvalidItem) {
    res.status(400).json({
      success: false,
      message: 'One or more cart items are invalid.'
    });
    return;
  }

  if (!customer || !isNonEmpty(customer.name) || !isNonEmpty(customer.phone) || !isNonEmpty(customer.address) || !isNonEmpty(customer.city) || !isNonEmpty(customer.zip)) {
    res.status(400).json({
      success: false,
      message: 'Please complete all required delivery details.'
    });
    return;
  }

  await delay(500);

  const amount = items.reduce((sum, item) => sum + MENU_PRICES[item.id] * Number(item.qty), 0);
  const orderId = buildOrderId();

  res.json({
    success: true,
    mode: 'demo',
    orderId,
    amount: Number(amount.toFixed(2)),
    currency: 'USD',
    message: 'Order created successfully.',
    redirectUrl: `/success.html?type=order&id=${encodeURIComponent(orderId)}`
  });
});

app.get('/api/availability', async (req, res) => {
  const { date } = req.query;
  await delay(150);

  res.json({
    success: true,
    date: date || null,
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'la-dolce-vita-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
});

app.use('/api/*splat', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

app.listen(PORT, () => {
  console.log(`La Dolce Vita API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
