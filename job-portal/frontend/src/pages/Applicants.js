import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StatusStamp from '../components/StatusStamp';

const STATUS_OPTIONS = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];

export default function Applicants() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/applications/job/${jobId}`),
      api.get(`/jobs/${jobId}`)
    ])
      .then(([appsRes, jobRes]) => {
        setApplications(appsRes.data.applications);
        setJob(jobRes.data.job);
      })
      .catch(() => setError('Could not load applicants.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleStatusChange = async (appId, status) => {
    try {
      await api.put(`/applications/${appId}/status`, { status });
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status.');
    }
  };

  const downloadResume = async (appId) => {
    const token = localStorage.getItem('jp_token');
    const url = `${process.env.REACT_APP_API_URL || '/api'}/applications/${appId}/resume`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `resume-${appId}`;
    link.click();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="eyebrow"><Link className="link" to="/recruiter">← Back to dashboard</Link></p>
        <h1>Applicants{job ? ` for ${job.title}` : ''}</h1>
        <p className="page-subtitle">Review resumes and move candidates through your pipeline.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && applications.length === 0 && (
        <div className="empty-state">
          <p>No applications yet for this role.</p>
          <span className="muted">Check back once candidates start applying.</span>
        </div>
      )}

      <div className="table-wrap">
        {applications.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Applied</th>
                <th>Cover letter</th>
                <th>Resume</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.applicant_name}</td>
                  <td>{app.applicant_email}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td className="cover-letter-cell">{app.cover_letter || <span className="muted">—</span>}</td>
                  <td><button className="btn-link" onClick={() => downloadResume(app.id)}>Download</button></td>
                  <td>
                    <div className="status-cell">
                      <StatusStamp status={app.status} />
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
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
