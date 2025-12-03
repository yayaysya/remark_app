// Habit routes: CRUD for habits belonging to the authenticated user.

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const user = req.user;
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at ASC', [user.id]);

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

router.post('/', async (req, res) => {
  const user = req.user;
  const { title, icon, themeColor } = req.body || {};

  if (!title || !themeColor) {
    return res.status(400).json({ error: 'title and themeColor are required' });
  }

  const id = uuidv4();
  const now = Date.now();

  const pool = getPool();
  await pool.query(
    'INSERT INTO habits (id, user_id, title, icon, theme_color, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, user.id, title, icon || '🌟', themeColor, 'active', now]
  );

  return res.status(201).json({
    habit: {
      id,
      userId: user.id,
      title,
      icon: icon || '🌟',
      themeColor,
      status: 'active',
      createdAt: now
    }
  });
});

router.delete('/:id', async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const pool = getPool();

  await pool.query('DELETE FROM habits WHERE id = ? AND user_id = ?', [id, user.id]);
  // checkins will be removed via foreign key cascade.

  return res.json({ success: true });
});

module.exports = router;

