require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scoresRoutes = require('./routes/scores');
const drawsRoutes = require('./routes/draws');
const charitiesRoutes = require('./routes/charities');
const adminRoutes = require('./routes/admin');
const winningsRoutes = require('./routes/winnings');
const paymentRoutes = require('./routes/payments');
const { requireAuth, requirePremium } = require('./middleware/authMiddleware');

const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ SMART MIDDLEWARE: Use JSON for everything EXCEPT the webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/draws', drawsRoutes);
app.use('/api/charities', charitiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/winnings', winningsRoutes);

app.get('/', (req, res) => res.send('Golf Charity API Running'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
