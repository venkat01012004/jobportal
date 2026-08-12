const { pool } = require('../config/db');

async function createUser({ name, email, hashedPassword, role, company_name }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password, role, company_name) VALUES (:name, :email, :password, :role, :company_name)`,
    { name, email, password: hashedPassword, role, company_name: company_name || null }
  );
  return result.insertId;
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE email = :email LIMIT 1`, { email });
  return rows[0] || null;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, company_name, created_at FROM users WHERE id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

module.exports = { createUser, findUserByEmail, findUserById };
