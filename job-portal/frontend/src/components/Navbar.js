import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">JP</span>
          <span className="brand-name">Job&nbsp;Portal</span>
        </Link>

        <nav className="nav-links">
          {!user && (
            <>
              <Link to="/jobs">Browse Jobs</Link>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="nav-cta">Get started</Link>
            </>
          )}

          {user && user.role === 'jobseeker' && (
            <>
              <Link to="/jobs">Browse Jobs</Link>
              <Link to="/my-applications">My Applications</Link>
              <span className="nav-user">Hi, {user.name.split(' ')[0]}</span>
              <button className="nav-cta ghost" onClick={handleLogout}>Log out</button>
            </>
          )}

          {user && user.role === 'recruiter' && (
            <>
              <Link to="/recruiter">Dashboard</Link>
              <Link to="/recruiter/post-job">Post a Job</Link>
              <span className="nav-user">Hi, {user.name.split(' ')[0]}</span>
              <button className="nav-cta ghost" onClick={handleLogout}>Log out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
