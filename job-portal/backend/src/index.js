require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { waitForDatabase, pool } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded resumes statically is intentionally NOT done here for
// access control reasons; downloads go through the protected /resume route.

// Health check endpoint (used by Docker healthcheck and Nginx)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ status: 'ok', service: 'job-portal-backend', db: 'connected' });
  } catch (err) {
    return res.status(503).json({ status: 'error', service: 'job-portal-backend', db: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

// Global error handler (catches multer errors, etc.)
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message);
  if (err.message && err.message.includes('Only PDF, DOC')) {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum resume size is 5MB.' });
  }
  return res.status(500).json({ message: 'Internal server error.' });
});

async function start() {
  try {
    await waitForDatabase();
    app.listen(PORT, () => {
      console.log(`[Server] Job Portal backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
