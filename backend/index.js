// Simple Habit backend entrypoint.
// Usage (local dev): `cd backend && npm install && npm start`
// Requires DATABASE_URL, PORT/BACKEND_PORT, JWT_SECRET via environment variables.

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const { initDb, getPool } = require('./db');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Static files for uploaded content (e.g., avatars)
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, 'uploads'))
);

// Simple request logging for visibility.
app.use((req, res, next) => {
  console.log(`[http] ${req.method} ${req.url}`);
  next();
});

// Auth middleware: attaches req.user for authenticated routes.
app.use(async (req, res, next) => {
  if (req.path === '/api/auth/send-code' || req.path === '/api/auth/login') {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
    const payload = jwt.verify(token, secret);
    const pool = getPool();
    const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [payload.userId]);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('[auth] token verification failed', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/users', require('./routes/users'));
app.use('/api/users', require('./routes/avatar'));
app.use('/api/follows', require('./routes/follows'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await initDb();
    const port = Number(process.env.PORT || process.env.BACKEND_PORT || 3000);
    app.listen(port, () => {
      console.log(`[server] Listening on port ${port}`);
    });
  } catch (err) {
    console.error('[server] Failed to start', err);
    process.exit(1);
  }
}

start();
