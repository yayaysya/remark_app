// Auth routes: email + password with JWT.

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const payload = { userId: user.id };
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function mapUserRow(row) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    username: row.username,
    nickname: row.nickname,
    voucherCount: row.voucher_count,
    totalCheckins: row.total_checkins,
    avatar: row.avatar || undefined
  };
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Register with email + password
router.post('/register', async (req, res) => {
  const { email, password, nickname } = req.body || {};

  if (!email || !isValidEmail(String(email).trim())) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: '密码长度至少为 6 位' });
  }

  const pool = getPool();
  const emailNorm = String(email).trim().toLowerCase();

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [emailNorm]
  );
  if (existing.length > 0) {
    return res.status(400).json({ error: '该邮箱已注册' });
  }

  const id = uuidv4();
  const now = Date.now();
  const passwordHash = await bcrypt.hash(String(password), 10);

  const displayName =
    (nickname && String(nickname).trim()) ||
    emailNorm.split('@')[0] ||
    'Habit Hero';

  await pool.query(
    `
      INSERT INTO users (
        id, email, phone, username, password_hash,
        nickname, avatar, voucher_count, total_checkins, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      emailNorm,
      null,
      null, // username 用户后续在“我的”页面编辑
      passwordHash,
      displayName,
      null,
      0,
      0,
      now,
      now
    ]
  );

  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

  const token = signToken(user);

  return res.status(201).json({
    token,
    user: mapUserRow(user)
  });
});

// Login with email + password
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码均为必填项' });
  }

  const pool = getPool();
  const emailNorm = String(email).trim().toLowerCase();

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [emailNorm]);
  if (rows.length === 0) {
    return res.status(400).json({ error: '邮箱或密码错误' });
  }

  const user = rows[0];
  if (!user.password_hash) {
    return res.status(400).json({ error: '该账号尚未设置密码，请联系管理员' });
  }

  const ok = await bcrypt.compare(String(password), user.password_hash);
  if (!ok) {
    return res.status(400).json({ error: '邮箱或密码错误' });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: mapUserRow(user)
  });
});

// Current user info
router.get('/me', async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json(mapUserRow(user));
});

module.exports = router;

