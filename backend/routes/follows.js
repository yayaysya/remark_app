// Follow routes: manage follower/followee relationships.

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../db');

const router = express.Router();

// Get current user's followees
router.get('/', async (req, res) => {
  const user = req.user;
  const pool = getPool();

  const [rows] = await pool.query(
    `
      SELECT u.id, u.username, u.nickname, u.avatar
      FROM user_follows f
      JOIN users u ON f.followee_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `,
    [user.id]
  );

  const follows = rows.map((row) => ({
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    avatar: row.avatar || undefined
  }));

  return res.json({ follows });
});

// Follow a user
router.post('/', async (req, res) => {
  const user = req.user;
  const { targetUserId } = req.body || {};
  if (!targetUserId) {
    return res.status(400).json({ error: '缺少目标用户 ID' });
  }
  if (targetUserId === user.id) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  const pool = getPool();

  const [[target]] = await pool.query(
    'SELECT id, username, nickname, avatar FROM users WHERE id = ?',
    [targetUserId]
  );
  if (!target) {
    return res.status(404).json({ error: '目标用户不存在' });
  }

  const id = uuidv4();
  const createdAt = Date.now();

  try {
    await pool.query(
      'INSERT INTO user_follows (id, follower_id, followee_id, created_at) VALUES (?, ?, ?, ?)',
      [id, user.id, targetUserId, createdAt]
    );
  } catch (err) {
    // Ignore duplicate follow attempts
    if (err && err.code !== 'ER_DUP_ENTRY') {
      console.error('[follows] Failed to insert follow', err);
      return res.status(500).json({ error: '关注失败' });
    }
  }

  return res.status(201).json({
    follow: {
      id: target.id,
      username: target.username,
      nickname: target.nickname,
      avatar: target.avatar || undefined
    }
  });
});

// Unfollow a user
router.delete('/:targetUserId', async (req, res) => {
  const user = req.user;
  const { targetUserId } = req.params;

  const pool = getPool();
  await pool.query(
    'DELETE FROM user_follows WHERE follower_id = ? AND followee_id = ?',
    [user.id, targetUserId]
  );

  return res.json({ success: true });
});

module.exports = router;

