const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/auth');

// Public: search / list jobs
router.get('/', jobController.listJobs);

// Recruiter: get their own posted jobs (must be before /:id)
router.get('/recruiter/mine', authenticate, authorize('recruiter'), jobController.myJobs);

// Public: view single job
router.get('/:id', jobController.getJob);

// Recruiter only: create/update/delete
router.post('/', authenticate, authorize('recruiter'), jobController.createJob);
router.put('/:id', authenticate, authorize('recruiter'), jobController.updateJob);
router.delete('/:id', authenticate, authorize('recruiter'), jobController.deleteJob);

module.exports = router;
