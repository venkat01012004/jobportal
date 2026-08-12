const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Job seeker: apply to a job (with resume upload)
router.post(
  '/',
  authenticate,
  authorize('jobseeker'),
  upload.single('resume'),
  applicationController.applyToJob
);

// Job seeker: view their own applications
router.get('/mine', authenticate, authorize('jobseeker'), applicationController.myApplications);

// Recruiter: view all applications across all their jobs
router.get('/recruiter/all', authenticate, authorize('recruiter'), applicationController.allApplicationsForRecruiter);

// Recruiter: view applicants for a specific job
router.get('/job/:jobId', authenticate, authorize('recruiter'), applicationController.applicationsForJob);

// Recruiter: update application status
router.put('/:id/status', authenticate, authorize('recruiter'), applicationController.updateStatus);

// Applicant or recruiter: download resume file
router.get('/:id/resume', authenticate, applicationController.downloadResume);

module.exports = router;
