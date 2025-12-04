// Avatar upload route using multer.

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db');

const router = express.Router();

const uploadDir = path.resolve(__dirname, '..', 'uploads', 'avatars');

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const user = req.user;
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const name = `${user.id}-${Date.now()}${safeExt}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  // Allow slightly larger avatar files but keep a sane upper bound.
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('不支持的图片格式'));
    }
    cb(null, true);
  }
});

// Wrap multer to provide JSON error responses instead of默认500 HTML
router.post('/me/avatar', (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '图片过大，请选择小于 5MB 的图片' });
      }
      return res.status(400).json({ error: err.message || '上传头像失败' });
    }
    next();
  });
}, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '未收到头像文件' });
  }

  const relativePath = `/uploads/avatars/${req.file.filename}`;

  try {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET avatar = ?, updated_at = ? WHERE id = ?',
      [relativePath, Date.now(), user.id]
    );
    const [[updated]] = await pool.query('SELECT * FROM users WHERE id = ?', [user.id]);
    return res.json({
      id: updated.id,
      phone: updated.phone,
      username: updated.username,
      nickname: updated.nickname,
      voucherCount: updated.voucher_count,
      totalCheckins: updated.total_checkins,
      avatar: updated.avatar || undefined
    });
  } catch (err) {
    console.error('[avatar] Failed to save avatar', err);
    return res.status(500).json({ error: '保存头像失败' });
  }
});

module.exports = router;
