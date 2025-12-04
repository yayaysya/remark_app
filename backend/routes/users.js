// User-related routes: profile, search, and public habit/checkin data.

const express = require('express');
const { getPool } = require('../db');

const router = express.Router();

// Helper to map DB user row to API shape
function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    username: row.username,
    nickname: row.nickname,
    voucherCount: row.voucher_count,
    totalCheckins: row.total_checkins,
    avatar: row.avatar || undefined
  };
}

// Current user profile
router.get('/me', async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json(mapUserRow(user));
});

// Update current user profile (username, nickname)
router.patch('/me', async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { username, nickname } = req.body || {};
  const fields = [];
  const params = [];

  const pool = getPool();

  if (username != null && username !== user.username) {
    const trimmed = String(username).trim();
    if (!trimmed) {
      return res.status(400).json({ error: '用户名不能为空' });
    }
    if (trimmed.length > 64) {
      return res.status(400).json({ error: '用户名过长' });
    }

    // Check unique
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id <> ?',
      [trimmed, user.id]
    );
    if (rows.length > 0) {
      return res.status(400).json({ error: '用户名已被占用' });
    }

    fields.push('username = ?');
    params.push(trimmed);
  }

  if (nickname != null && nickname !== user.nickname) {
    const trimmedNick = String(nickname).trim();
    fields.push('nickname = ?');
    params.push(trimmedNick || null);
  }

  if (fields.length === 0) {
    return res.json(mapUserRow(user));
  }

  fields.push('updated_at = ?');
  params.push(Date.now(), user.id);

  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  const [[updated]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
  req.user = updated;
  return res.json(mapUserRow(updated));
});

// Search users by username (fuzzy) or phone (exact)
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) {
    return res.json({ users: [] });
  }

  const pool = getPool();
  const like = `%${q}%`;

  const [rows] = await pool.query(
    `
      SELECT id, phone, username, nickname, avatar
      FROM users
      WHERE (username LIKE ?)
         OR (phone = ?)
      ORDER BY created_at DESC
      LIMIT 20
    `,
    [like, q]
  );

  const users = rows.map((row) => ({
    id: row.id,
    phone: row.phone,
    username: row.username,
    nickname: row.nickname,
    avatar: row.avatar || undefined
  }));

  return res.json({ users });
});

// Public user profile by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  const [[row]] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

  if (!row) {
    return res.status(404).json({ error: '用户不存在' });
  }

  return res.json(mapUserRow(row));
});

// Public habits of a user
router.get('/:id/habits', async (req, res) => {
  const { id } = req.params;
  const pool = getPool();

  const [[user]] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const [rows] = await pool.query(
    'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at ASC',
    [id]
  );

  const habits = rows.map((h) => ({
    id: h.id,
    userId: h.user_id,
    title: h.title,
    icon: h.icon,
    themeColor: h.theme_color,
    status: h.status,
    createdAt: h.created_at
  }));

  return res.json({ habits });
});

// Public checkins of a user
router.get('/:id/checkins', async (req, res) => {
  const { id } = req.params;
  const { habitId } = req.query;
  const pool = getPool();

  const [[user]] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let rows;
  if (habitId) {
    [rows] = await pool.query(
      'SELECT * FROM checkins WHERE user_id = ? AND habit_id = ? ORDER BY timestamp ASC',
      [id, habitId]
    );
  } else {
    [rows] = await pool.query(
      'SELECT * FROM checkins WHERE user_id = ? ORDER BY timestamp ASC',
      [id]
    );
  }

  const checkins = rows.map((c) => ({
    id: c.id,
    userId: c.user_id,
    habitId: c.habit_id,
    date: c.date,
    timestamp: c.timestamp,
    type: c.type,
    note: c.note || undefined
  }));

  return res.json({ checkins });
});

module.exports = router;

