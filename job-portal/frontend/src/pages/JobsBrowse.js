import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import JobCard from '../components/JobCard';

export default function JobsBrowse() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ keyword: '', location: '', job_type: '' });

  const limit = 9;

  const fetchJobs = useCallback(async (opts) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/jobs', {
        params: { ...opts.filters, page: opts.page, limit }
      });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (err) {
      setError('Could not load jobs. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs({ filters, page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs({ filters, page: 1 });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page-container">
      <div className="page-header">
        <p className="eyebrow">{total} open role{total !== 1 ? 's' : ''}</p>
        <h1>Find your next role</h1>
        <p className="page-subtitle">Search across every job currently posted on Job Portal.</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Title, skill, or company"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        />
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <select
          value={filters.job_type}
          onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
        >
          <option value="">Any job type</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
          <option value="Remote">Remote</option>
        </select>
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="muted">Loading jobs…</p>}

      {!loading && jobs.length === 0 && (
        <div className="empty-state">
          <p>No jobs match your search yet.</p>
          <span className="muted">Try broadening your keyword or clearing the location filter.</span>
        </div>
      )}

      <div className="job-grid">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
