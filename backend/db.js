// Database helper for MySQL connection and schema initialization.
// Usage: call `initDb()` on server startup, then use `getPool()` to run queries.

const mysql = require('mysql2/promise');

let pool;

function parseDatabaseConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname.replace(/^\//, '') || undefined
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'habit_app'
  };
}

async function initDb() {
  const config = parseDatabaseConfig();

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Basic schema; simple and explicit to keep migrations out of scope.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      phone VARCHAR(32) NOT NULL UNIQUE,
      nickname VARCHAR(255),
      avatar VARCHAR(1024),
      voucher_count INT NOT NULL DEFAULT 0,
      total_checkins INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS habits (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      icon VARCHAR(16),
      theme_color VARCHAR(32),
      status VARCHAR(32) NOT NULL,
      created_at BIGINT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS checkins (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      habit_id VARCHAR(64) NOT NULL,
      date VARCHAR(16) NOT NULL,
      timestamp BIGINT NOT NULL,
      type VARCHAR(32) NOT NULL,
      note TEXT,
      UNIQUE KEY unique_checkin (user_id, habit_id, date, type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    )
  `);

  console.log('[db] Connected and schema ensured');
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool is not initialized. Call initDb() first.');
  }
  return pool;
}

module.exports = {
  initDb,
  getPool
};

