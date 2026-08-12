import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatusStamp from '../components/StatusStamp';
import { useAuth } from '../context/AuthContext';

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');
  const [applyErr, setApplyErr] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/jobs/${id}`)
      .then(({ data }) => { if (active) setJob(data.job); })
      .catch(() => { if (active) setError('Job not found.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyErr('');
    setApplyMsg('');

    if (!user) {
      navigate('/login');
      return;
    }
    if (!resume) {
      setApplyErr('Please attach your resume (PDF, DOC, or DOCX).');
      return;
    }

    const formData = new FormData();
    formData.append('job_id', id);
    formData.append('resume', resume);
    if (coverLetter) formData.append('cover_letter', coverLetter);

    setApplying(true);
    try {
      await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setApplyMsg('Application submitted! You can track its status under "My Applications".');
      setResume(null);
      setCoverLetter('');
    } catch (err) {
      setApplyErr(err.response?.data?.message || 'Could not submit application.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="page-container"><p className="muted">Loading…</p></div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!job) return null;

  const salary = job.salary_min || job.salary_max
    ? `$${Number(job.salary_min || 0).toLocaleString()} – $${Number(job.salary_max || 0).toLocaleString()}`
    : null;

  return (
    <div className="page-container narrow">
      <div className="job-detail-header">
        <div>
          <p className="eyebrow">{job.company}</p>
          <h1>{job.title}</h1>
          <div className="job-card-meta">
            <span>{job.location}</span>
            <span className="dot">•</span>
            <span>{job.job_type}</span>
            {salary && <><span className="dot">•</span><span>{salary}</span></>}
          </div>
        </div>
        <StatusStamp status={job.status} />
      </div>

      {job.skills && (
        <div className="job-card-skills">
          {job.skills.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
            <span className="skill-pill" key={skill}>{skill}</span>
          ))}
        </div>
      )}

      <div className="card">
        <h2>About this role</h2>
        <p className="job-description">{job.description}</p>
      </div>

      {(!user || user.role === 'jobseeker') && job.status === 'open' && (
        <div className="card">
          <h2>Apply for this role</h2>
          {applyMsg && <div className="alert alert-success">{applyMsg}</div>}
          {applyErr && <div className="alert alert-error">{applyErr}</div>}
          {!user && (
            <p className="muted">You'll need to <a href="/login">log in</a> as a job seeker to apply.</p>
          )}
          <form onSubmit={handleApply} className="form">
            <label>
              Resume (PDF, DOC, DOCX — max 5MB)
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files[0])}
              />
            </label>
            <label>
              Cover letter (optional)
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell the recruiter why you're a great fit…"
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={applying}>
              {applying ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        </div>
      )}

      {job.status !== 'open' && (
        <div className="alert alert-info">This role is no longer accepting applications.</div>
      )}
    </div>
  );
}
