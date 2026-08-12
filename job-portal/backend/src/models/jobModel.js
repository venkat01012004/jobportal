const { pool } = require('../config/db');

async function createJob(job) {
  const [result] = await pool.execute(
    `INSERT INTO jobs (recruiter_id, title, description, company, location, job_type, salary_min, salary_max, skills)
     VALUES (:recruiter_id, :title, :description, :company, :location, :job_type, :salary_min, :salary_max, :skills)`,
    {
      recruiter_id: job.recruiter_id,
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      job_type: job.job_type || 'Full-time',
      salary_min: job.salary_min ?? null,
      salary_max: job.salary_max ?? null,
      skills: job.skills || null
    }
  );
  return result.insertId;
}

async function updateJob(id, recruiterId, fields) {
  const allowed = ['title', 'description', 'company', 'location', 'job_type', 'salary_min', 'salary_max', 'skills', 'status'];
  const setClauses = [];
  const params = { id, recruiter_id: recruiterId };

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (setClauses.length === 0) return false;

  const [result] = await pool.execute(
    `UPDATE jobs SET ${setClauses.join(', ')} WHERE id = :id AND recruiter_id = :recruiter_id`,
    params
  );
  return result.affectedRows > 0;
}

async function deleteJob(id, recruiterId) {
  const [result] = await pool.execute(
    `DELETE FROM jobs WHERE id = :id AND recruiter_id = :recruiter_id`,
    { id, recruiter_id: recruiterId }
  );
  return result.affectedRows > 0;
}

async function findJobById(id) {
  const [rows] = await pool.execute(
    `SELECT jobs.*, users.name AS recruiter_name, users.company_name AS recruiter_company
     FROM jobs JOIN users ON jobs.recruiter_id = users.id
     WHERE jobs.id = :id LIMIT 1`,
    { id }
  );
  return rows[0] || null;
}

async function findJobsByRecruiter(recruiterId) {
  const [rows] = await pool.execute(
    `SELECT * FROM jobs WHERE recruiter_id = :recruiter_id ORDER BY created_at DESC`,
    { recruiter_id: recruiterId }
  );
  return rows;
}

async function searchJobs({ keyword, location, job_type, page = 1, limit = 10 }) {
  const conditions = [`status = 'open'`];
  const params = {};

  if (keyword) {
    conditions.push(`(title LIKE :keyword OR description LIKE :keyword OR skills LIKE :keyword OR company LIKE :keyword)`);
    params.keyword = `%${keyword}%`;
  }
  if (location) {
    conditions.push(`location LIKE :location`);
    params.location = `%${location}%`;
  }
  if (job_type) {
    conditions.push(`job_type = :job_type`);
    params.job_type = job_type;
  }

  const offset = (Math.max(1, page) - 1) * limit;
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM jobs ${whereClause} ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    params
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM jobs ${whereClause}`,
    params
  );

  return { jobs: rows, total: countRows[0].total, page: Number(page), limit: Number(limit) };
}

module.exports = { createJob, updateJob, deleteJob, findJobById, findJobsByRecruiter, searchJobs };
