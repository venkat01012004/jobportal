const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'job_portal_user',
  password: process.env.DB_PASSWORD || 'job_portal_pass',
  database: process.env.DB_NAME || 'job_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

// Wait until MySQL is actually ready to accept connections.
// Useful because the backend container can start slightly before
// MySQL has finished initializing, even with a healthcheck in compose.
async function waitForDatabase(retries = 20, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      console.log('[DB] Connected to MySQL successfully.');
      return true;
    } catch (err) {
      console.log(`[DB] Waiting for MySQL... attempt ${attempt}/${retries} (${err.code || err.message})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('[DB] Could not connect to MySQL after multiple retries.');
}

module.exports = { pool, waitForDatabase };
