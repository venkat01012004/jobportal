import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

const EMPTY = {
  title: '', description: '', company: '', location: '',
  job_type: 'Full-time', salary_min: '', salary_max: '', skills: ''
};

export default function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/jobs/${id}`)
      .then(({ data }) => {
        const j = data.job;
        setForm({
          title: j.title, description: j.description, company: j.company,
          location: j.location, job_type: j.job_type,
          salary_min: j.salary_min ?? '', salary_max: j.salary_max ?? '',
          skills: j.skills ?? ''
        });
      })
      .catch(() => setError('Could not load job for editing.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null
    };
    try {
      if (isEdit) {
        await api.put(`/jobs/${id}`, payload);
      } else {
        await api.post('/jobs', payload);
      }
      navigate('/recruiter');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save job.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><p className="muted">Loading…</p></div>;

  return (
    <div className="page-container narrow">
      <div className="page-header">
        <p className="eyebrow">{isEdit ? 'Edit listing' : 'New listing'}</p>
        <h1>{isEdit ? 'Edit job posting' : 'Post a new job'}</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form card">
        <label>
          Job title
          <input type="text" name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Senior Backend Engineer" />
        </label>
        <label>
          Company
          <input type="text" name="company" required value={form.company} onChange={handleChange} placeholder="e.g. Acme Inc." />
        </label>
        <div className="form-row">
          <label>
            Location
            <input type="text" name="location" required value={form.location} onChange={handleChange} placeholder="e.g. Remote, Hyderabad" />
          </label>
          <label>
            Job type
            <select name="job_type" value={form.job_type} onChange={handleChange}>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Minimum salary (USD)
            <input type="number" name="salary_min" min="0" value={form.salary_min} onChange={handleChange} placeholder="e.g. 60000" />
          </label>
          <label>
            Maximum salary (USD)
            <input type="number" name="salary_max" min="0" value={form.salary_max} onChange={handleChange} placeholder="e.g. 90000" />
          </label>
        </div>
        <label>
          Skills (comma separated)
          <input type="text" name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. Node.js, React, MySQL" />
        </label>
        <label>
          Job description
          <textarea name="description" rows={8} required value={form.description} onChange={handleChange} placeholder="Describe responsibilities, requirements, and benefits…" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish job'}
        </button>
      </form>
    </div>
  );
}
