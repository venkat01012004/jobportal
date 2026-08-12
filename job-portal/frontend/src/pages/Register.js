import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'jobseeker', company_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'recruiter' ? '/recruiter' : '/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Join Job Portal</p>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Choose how you'll use the platform.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="role-toggle">
          <button
            type="button"
            className={form.role === 'jobseeker' ? 'active' : ''}
            onClick={() => setForm({ ...form, role: 'jobseeker' })}
          >
            I'm a Job Seeker
          </button>
          <button
            type="button"
            className={form.role === 'recruiter' ? 'active' : ''}
            onClick={() => setForm({ ...form, role: 'recruiter' })}
          >
            I'm a Recruiter
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Full name
            <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe" />
          </label>
          <label>
            Email
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </label>
          {form.role === 'recruiter' && (
            <label>
              Company name
              <input type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Inc." />
            </label>
          )}
          <label>
            Password
            <input type="password" name="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
