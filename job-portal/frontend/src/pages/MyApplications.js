import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatusStamp from '../components/StatusStamp';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/applications/mine')
      .then(({ data }) => setApplications(data.applications))
      .catch(() => setError('Could not load your applications.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="eyebrow">Your history</p>
        <h1>My Applications</h1>
        <p className="page-subtitle">Track every role you've applied to and its current status.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && applications.length === 0 && (
        <div className="empty-state">
          <p>You haven't applied to any jobs yet.</p>
          <span className="muted">Browse open roles and submit your first application.</span>
        </div>
      )}

      <div className="table-wrap">
        {applications.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Job title</th>
                <th>Company</th>
                <th>Location</th>
                <th>Applied on</th>
                <th>Status</th>
                <th>Resume</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.job_title}</td>
                  <td>{app.company}</td>
                  <td>{app.location}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td><StatusStamp status={app.status} /></td>
                  <td>
                    <a
                      className="link"
                      href={`${process.env.REACT_APP_API_URL || '/api'}/applications/${app.id}/resume`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        // Attach auth header via a fetch-based download since <a> can't set headers
                        e.preventDefault();
                        const token = localStorage.getItem('jp_token');
                        const url = `${process.env.REACT_APP_API_URL || '/api'}/applications/${app.id}/resume`;
                        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                          .then((res) => res.blob())
                          .then((blob) => {
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(blob);
                            link.download = `resume-${app.id}`;
                            link.click();
                          });
                      }}
                    >
                      Download
                    </a>
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
