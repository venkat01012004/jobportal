import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="hero">
      <div className="hero-inner">
        <p className="eyebrow">Job Portal</p>
        <h1>Where open roles meet ready candidates.</h1>
        <p className="hero-subtitle">
          Post a job in minutes as a recruiter, or search, apply, and track every
          application in one place as a job seeker.
        </p>

        <div className="hero-actions">
          {!user && (
            <>
              <Link to="/register" className="btn btn-primary large">Create free account</Link>
              <Link to="/jobs" className="btn btn-ghost large">Browse open roles</Link>
            </>
          )}
          {user && user.role === 'jobseeker' && (
            <Link to="/jobs" className="btn btn-primary large">Browse open roles</Link>
          )}
          {user && user.role === 'recruiter' && (
            <Link to="/recruiter/post-job" className="btn btn-primary large">Post a job</Link>
          )}
        </div>

        <div className="hero-stamp-row">
          <span className="stamp stamp-open">Open</span>
          <span className="stamp stamp-reviewed">Reviewed</span>
          <span className="stamp stamp-shortlisted">Shortlisted</span>
          <span className="stamp stamp-accepted">Accepted</span>
        </div>
      </div>
    </div>
  );
}
