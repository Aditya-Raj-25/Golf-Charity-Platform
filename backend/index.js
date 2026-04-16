require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scoresRoutes = require('./routes/scores');
const drawsRoutes = require('./routes/draws');
const charitiesRoutes = require('./routes/charities');
const adminRoutes = require('./routes/admin');
const winningsRoutes = require('./routes/winnings');

const app = express();

app.use(cors({
  origin: '*', // For MVP, allow all
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => res.send('Golf Charity API is running. Visit http://localhost:5173 for the frontend.'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/draws', drawsRoutes);
app.use('/api/charities', charitiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/winnings', winningsRoutes);

// Listen for Render/Local (exclude Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel Serverless
module.exports = app;
