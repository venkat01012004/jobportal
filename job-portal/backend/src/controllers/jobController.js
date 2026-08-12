const jobModel = require('../models/jobModel');

async function createJob(req, res) {
  try {
    const { title, description, company, location, job_type, salary_min, salary_max, skills } = req.body;

    if (!title || !description || !company || !location) {
      return res.status(400).json({ message: 'Title, description, company, and location are required.' });
    }

    const jobId = await jobModel.createJob({
      recruiter_id: req.user.id,
      title,
      description,
      company,
      location,
      job_type,
      salary_min,
      salary_max,
      skills
    });

    const job = await jobModel.findJobById(jobId);
    return res.status(201).json({ message: 'Job posted successfully.', job });
  } catch (err) {
    console.error('[Jobs] Create error:', err);
    return res.status(500).json({ message: 'Server error while creating job.' });
  }
}

async function updateJob(req, res) {
  try {
    const jobId = req.params.id;
    const existing = await jobModel.findJobById(jobId);
    if (!existing) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (existing.recruiter_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own job postings.' });
    }

    const updated = await jobModel.updateJob(jobId, req.user.id, req.body);
    if (!updated) {
      return res.status(400).json({ message: 'No valid fields provided to update.' });
    }

    const job = await jobModel.findJobById(jobId);
    return res.status(200).json({ message: 'Job updated successfully.', job });
  } catch (err) {
    console.error('[Jobs] Update error:', err);
    return res.status(500).json({ message: 'Server error while updating job.' });
  }
}

async function deleteJob(req, res) {
  try {
    const jobId = req.params.id;
    const existing = await jobModel.findJobById(jobId);
    if (!existing) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (existing.recruiter_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own job postings.' });
    }

    await jobModel.deleteJob(jobId, req.user.id);
    return res.status(200).json({ message: 'Job deleted successfully.' });
  } catch (err) {
    console.error('[Jobs] Delete error:', err);
    return res.status(500).json({ message: 'Server error while deleting job.' });
  }
}

async function getJob(req, res) {
  try {
    const job = await jobModel.findJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    return res.status(200).json({ job });
  } catch (err) {
    console.error('[Jobs] Get error:', err);
    return res.status(500).json({ message: 'Server error while fetching job.' });
  }
}

async function listJobs(req, res) {
  try {
    const { keyword, location, job_type, page, limit } = req.query;
    const result = await jobModel.searchJobs({
      keyword,
      location,
      job_type,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Jobs] List error:', err);
    return res.status(500).json({ message: 'Server error while listing jobs.' });
  }
}

async function myJobs(req, res) {
  try {
    const jobs = await jobModel.findJobsByRecruiter(req.user.id);
    return res.status(200).json({ jobs });
  } catch (err) {
    console.error('[Jobs] My jobs error:', err);
    return res.status(500).json({ message: 'Server error while fetching your jobs.' });
  }
}

module.exports = { createJob, updateJob, deleteJob, getJob, listJobs, myJobs };
