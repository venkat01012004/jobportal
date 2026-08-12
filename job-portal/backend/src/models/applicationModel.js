const { pool } = require('../config/db');

async function createApplication({ job_id, jobseeker_id, resume_path, cover_letter }) {
  const [result] = await pool.execute(
    `INSERT INTO applications (job_id, jobseeker_id, resume_path, cover_letter)
     VALUES (:job_id, :jobseeker_id, :resume_path, :cover_letter)`,
    { job_id, jobseeker_id, resume_path, cover_letter: cover_letter || null }
  );
  return result.insertId;
}

async function findExistingApplication(jobId, jobseekerId) {
  const [rows] = await pool.execute(
    `SELECT * FROM applications WHERE job_id = :job_id AND jobseeker_id = :jobseeker_id LIMIT 1`,
    { job_id: jobId, jobseeker_id: jobseekerId }
  );
  return rows[0] || null;
}

async function findApplicationsByJobSeeker(jobseekerId) {
  const [rows] = await pool.execute(
    `SELECT applications.*, jobs.title AS job_title, jobs.company, jobs.location
     FROM applications JOIN jobs ON applications.job_id = jobs.id
     WHERE applications.jobseeker_id = :jobseeker_id
     ORDER BY applications.applied_at DESC`,
    { jobseeker_id: jobseekerId }
  );
  return rows;
}

async function findApplicationsByJob(jobId, recruiterId) {
  const [rows] = await pool.execute(
    `SELECT applications.*, users.name AS applicant_name, users.email AS applicant_email
     FROM applications
     JOIN users ON applications.jobseeker_id = users.id
     JOIN jobs ON applications.job_id = jobs.id
     WHERE applications.job_id = :job_id AND jobs.recruiter_id = :recruiter_id
     ORDER BY applications.applied_at DESC`,
    { job_id: jobId, recruiter_id: recruiterId }
  );
  return rows;
}

async function findApplicationsForRecruiter(recruiterId) {
  const [rows] = await pool.execute(
    `SELECT applications.*, jobs.title AS job_title, users.name AS applicant_name, users.email AS applicant_email
     FROM applications
     JOIN jobs ON applications.job_id = jobs.id
     JOIN users ON applications.jobseeker_id = users.id
     WHERE jobs.recruiter_id = :recruiter_id
     ORDER BY applications.applied_at DESC`,
    { recruiter_id: recruiterId }
  );
  return rows;
}

async function updateApplicationStatus(applicationId, recruiterId, status) {
  const [result] = await pool.execute(
    `UPDATE applications a
     JOIN jobs j ON a.job_id = j.id
     SET a.status = :status
     WHERE a.id = :id AND j.recruiter_id = :recruiter_id`,
    { id: applicationId, recruiter_id: recruiterId, status }
  );
  return result.affectedRows > 0;
}

async function findApplicationById(id) {
  const [rows] = await pool.execute(`SELECT * FROM applications WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
}

module.exports = {
  createApplication,
  findExistingApplication,
  findApplicationsByJobSeeker,
  findApplicationsByJob,
  findApplicationsForRecruiter,
  updateApplicationStatus,
  findApplicationById
};
