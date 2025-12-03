// Check-in routes: list/add/remove checkins and spend vouchers.

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const user = req.user;
  const { habitId } = req.query;
  const pool = getPool();

  let rows;
  if (habitId) {
    [rows] = await pool.query(
      'SELECT * FROM checkins WHERE user_id = ? AND habit_id = ? ORDER BY timestamp ASC',
      [user.id, habitId]
    );
  } else {
    [rows] = await pool.query('SELECT * FROM checkins WHERE user_id = ? ORDER BY timestamp ASC', [user.id]);
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

router.post('/', async (req, res) => {
  const user = req.user;
  const { habitId, date, note } = req.body || {};

  if (!habitId) {
    return res.status(400).json({ error: 'habitId is required' });
  }

  const today = new Date();
  const dateStr = date || today.toISOString().split('T')[0];
  const timestamp = today.getTime();

  const pool = getPool();

  // Idempotency: if a NORMAL checkin already exists for this date, just return it.
  let [rows] = await pool.query(
    'SELECT * FROM checkins WHERE user_id = ? AND habit_id = ? AND date = ? AND type = ?',
    [user.id, habitId, dateStr, 'NORMAL']
  );

  if (rows.length > 0) {
    const existing = rows[0];
    return res.json({
      checkin: {
        id: existing.id,
        userId: existing.user_id,
        habitId: existing.habit_id,
        date: existing.date,
        timestamp: existing.timestamp,
        type: existing.type,
        note: existing.note || undefined
      },
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        voucherCount: user.voucher_count,
        totalCheckins: user.total_checkins,
        avatar: user.avatar || undefined
      }
    });
  }

  const id = uuidv4();

  await pool.query(
    'INSERT INTO checkins (id, user_id, habit_id, date, timestamp, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, user.id, habitId, dateStr, timestamp, 'NORMAL', note || null]
  );

  // Update user stats: increment total_checkins and award voucher every 4th checkin.
  await pool.query(
    'UPDATE users SET total_checkins = total_checkins + 1 WHERE id = ?',
    [user.id]
  );

  const [[updatedUser]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);

  if (updatedUser.total_checkins > 0 && updatedUser.total_checkins % 4 === 0) {
    await pool.query('UPDATE users SET voucher_count = voucher_count + 1 WHERE id = ?', [user.id]);
    const [[voucherUpdatedUser]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    updatedUser.voucher_count = voucherUpdatedUser.voucher_count;
  }

  return res.status(201).json({
    checkin: {
      id,
      userId: user.id,
      habitId,
      date: dateStr,
      timestamp,
      type: 'NORMAL',
      note: note || undefined
    },
    user: {
      id: updatedUser.id,
      phone: updatedUser.phone,
      nickname: updatedUser.nickname,
      voucherCount: updatedUser.voucher_count,
      totalCheckins: updatedUser.total_checkins,
      avatar: updatedUser.avatar || undefined
    }
  });
});

router.delete('/', async (req, res) => {
  const user = req.user;
  const { habitId, date } = req.body || {};

  if (!habitId || !date) {
    return res.status(400).json({ error: 'habitId and date are required' });
  }

  const pool = getPool();
  await pool.query(
    'DELETE FROM checkins WHERE user_id = ? AND habit_id = ? AND date = ? AND type = ?',
    [user.id, habitId, date, 'NORMAL']
  );

  // For simplicity, we do not roll back total_checkins/vouchers, consistent with previous MVP comment.
  return res.json({ success: true });
});

router.post('/vouchers/spend', async (req, res) => {
  const user = req.user;
  const { habitId, date } = req.body || {};

  if (!habitId || !date) {
    return res.status(400).json({ error: 'habitId and date are required' });
  }

  const pool = getPool();
  const [[currentUser]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);

  if (!currentUser || currentUser.voucher_count <= 0) {
    return res.status(400).json({ error: 'Not enough vouchers' });
  }

  const id = uuidv4();
  const timestamp = Date.now();

  await pool.query(
    'INSERT INTO checkins (id, user_id, habit_id, date, timestamp, type, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, user.id, habitId, date, timestamp, 'RETROACTIVE', null]
  );

  await pool.query(
    'UPDATE users SET voucher_count = voucher_count - 1 WHERE id = ?',
    [user.id]
  );

  const [[updatedUser]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);

  return res.json({
    success: true,
    checkin: {
      id,
      userId: user.id,
      habitId,
      date,
      timestamp,
      type: 'RETROACTIVE'
    },
    user: {
      id: updatedUser.id,
      phone: updatedUser.phone,
      nickname: updatedUser.nickname,
      voucherCount: updatedUser.voucher_count,
      totalCheckins: updatedUser.total_checkins,
      avatar: updatedUser.avatar || undefined
    }
  });
});

module.exports = router;

