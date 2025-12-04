// Auth routes: send code, login, get current user.
// All responses are JSON; designed for consumption by the React frontend.

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');

const router = express.Router();

// In-memory store for verification codes (sufficient for this app and dev usage).
const codeStore = new Map(); // phone -> { code, expiresAt }

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const payload = { userId: user.id };
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

router.post('/send-code', async (req, res) => {
  const { phone } = req.body || {};
  if (!phone || String(phone).length < 5) {
    return res.status(400).json({ error: 'Invalid phone' });
  }

  const code = generateCode();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  codeStore.set(String(phone), { code, expiresAt });

  console.log(`[auth] send-code for ${phone}: ${code}`);

  // In dev, also return the code to simplify manual testing.
  return res.json({ success: true, code });
});

router.post('/login', async (req, res) => {
  const { phone, code } = req.body || {};
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  const entry = codeStore.get(String(phone));
  if (!entry || entry.code !== String(code) || entry.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  const pool = getPool();
  const now = Date.now();

  // Find or create user by phone.
  let [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  let user;
  if (rows.length === 0) {
    const id = uuidv4();
    const nickname = 'Habit Hero';
    const username = `user_${phone}`.slice(0, 64);
    const avatar = null;
    await pool.query(
      'INSERT INTO users (id, phone, username, nickname, avatar, voucher_count, total_checkins, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, phone, username, nickname, avatar, 0, 0, now, now]
    );
    [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  }

  user = rows[0];

  // Ensure legacy users have a username
  if (!user.username) {
    const generated = `user_${user.phone}`.slice(0, 64);
    await pool.query(
      'UPDATE users SET username = ?, updated_at = ? WHERE id = ?',
      [generated, now, user.id]
    );
    const [[updated]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    user = updated;
  }

  const token = signToken(user);
  codeStore.delete(String(phone));

  return res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      username: user.username,
      nickname: user.nickname,
      voucherCount: user.voucher_count,
      totalCheckins: user.total_checkins,
      avatar: user.avatar || undefined
    }
  });
});

router.get('/me', async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({
    id: user.id,
    phone: user.phone,
    username: user.username,
    nickname: user.nickname,
    voucherCount: user.voucher_count,
    totalCheckins: user.total_checkins,
    avatar: user.avatar || undefined
  });
});

module.exports = router;
