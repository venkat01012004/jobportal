import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatusStamp from '../components/StatusStamp';

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadJobs = () => {
    setLoading(true);
    api.get('/jobs/recruiter/mine')
      .then(({ data }) => setJobs(data.jobs))
      .catch(() => setError('Could not load your job postings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting? This cannot be undone.')) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete job.');
    }
  };

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await api.put(`/jobs/${job.id}`, { status: newStatus });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update job status.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header row">
        <div>
          <p className="eyebrow">Recruiter dashboard</p>
          <h1>Your job postings</h1>
          <p className="page-subtitle">Manage listings and review applicants in one place.</p>
        </div>
        <Link to="/recruiter/post-job" className="btn btn-primary">+ Post a job</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && jobs.length === 0 && (
        <div className="empty-state">
          <p>You haven't posted any jobs yet.</p>
          <span className="muted">Create your first listing to start receiving applications.</span>
        </div>
      )}

      <div className="table-wrap">
        {jobs.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Location</th>
                <th>Type</th>
                <th>Posted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td><Link className="link" to={`/jobs/${job.id}`}>{job.title}</Link></td>
                  <td>{job.location}</td>
                  <td>{job.job_type}</td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                  <td><StatusStamp status={job.status} /></td>
                  <td className="actions-cell">
                    <button className="btn-link" onClick={() => navigate(`/recruiter/jobs/${job.id}/applicants`)}>Applicants</button>
                    <button className="btn-link" onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}>Edit</button>
                    <button className="btn-link" onClick={() => toggleStatus(job)}>
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                    <button className="btn-link danger" onClick={() => handleDelete(job.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
