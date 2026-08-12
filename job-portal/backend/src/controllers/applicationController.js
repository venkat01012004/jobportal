const path = require('path');
const fs = require('fs');
const applicationModel = require('../models/applicationModel');
const jobModel = require('../models/jobModel');

async function applyToJob(req, res) {
  try {
    const { job_id, cover_letter } = req.body;

    if (!job_id) {
      return res.status(400).json({ message: 'job_id is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'A resume file (PDF/DOC/DOCX) is required.' });
    }

    const job = await jobModel.findJobById(job_id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (job.status !== 'open') {
      return res.status(400).json({ message: 'This job is no longer accepting applications.' });
    }

    const existing = await applicationModel.findExistingApplication(job_id, req.user.id);
    if (existing) {
      return res.status(409).json({ message: 'You have already applied to this job.' });
    }

    const resumePath = `resumes/${req.file.filename}`;
    const applicationId = await applicationModel.createApplication({
      job_id,
      jobseeker_id: req.user.id,
      resume_path: resumePath,
      cover_letter
    });

    const application = await applicationModel.findApplicationById(applicationId);
    return res.status(201).json({ message: 'Application submitted successfully.', application });
  } catch (err) {
    console.error('[Applications] Apply error:', err);
    return res.status(500).json({ message: 'Server error while submitting application.' });
  }
}

async function myApplications(req, res) {
  try {
    const applications = await applicationModel.findApplicationsByJobSeeker(req.user.id);
    return res.status(200).json({ applications });
  } catch (err) {
    console.error('[Applications] My applications error:', err);
    return res.status(500).json({ message: 'Server error while fetching applications.' });
  }
}

async function applicationsForJob(req, res) {
  try {
    const applications = await applicationModel.findApplicationsByJob(req.params.jobId, req.user.id);
    return res.status(200).json({ applications });
  } catch (err) {
    console.error('[Applications] For job error:', err);
    return res.status(500).json({ message: 'Server error while fetching applicants.' });
  }
}

async function allApplicationsForRecruiter(req, res) {
  try {
    const applications = await applicationModel.findApplicationsForRecruiter(req.user.id);
    return res.status(200).json({ applications });
  } catch (err) {
    console.error('[Applications] Recruiter applications error:', err);
    return res.status(500).json({ message: 'Server error while fetching applications.' });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await applicationModel.updateApplicationStatus(req.params.id, req.user.id, status);
    if (!updated) {
      return res.status(404).json({ message: 'Application not found or you do not have permission to update it.' });
    }

    return res.status(200).json({ message: 'Application status updated.' });
  } catch (err) {
    console.error('[Applications] Update status error:', err);
    return res.status(500).json({ message: 'Server error while updating application status.' });
  }
}

async function downloadResume(req, res) {
  try {
    const application = await applicationModel.findApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // Only the applicant themself or the recruiter who owns the job can download.
    const job = await jobModel.findJobById(application.job_id);
    const isOwnerApplicant = req.user.id === application.jobseeker_id;
    const isOwnerRecruiter = job && req.user.id === job.recruiter_id;

    if (!isOwnerApplicant && !isOwnerRecruiter) {
      return res.status(403).json({ message: 'You do not have permission to access this resume.' });
    }

    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
    const filePath = path.join(uploadDir, application.resume_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume file not found on server.' });
    }

    return res.download(filePath);
  } catch (err) {
    console.error('[Applications] Download resume error:', err);
    return res.status(500).json({ message: 'Server error while downloading resume.' });
  }
}

module.exports = {
  applyToJob,
  myApplications,
  applicationsForJob,
  allApplicationsForRecruiter,
  updateStatus,
  downloadResume
};
