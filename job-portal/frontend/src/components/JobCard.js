import React from 'react';
import { Link } from 'react-router-dom';
import StatusStamp from './StatusStamp';

function formatSalary(min, max) {
  if (!min && !max) return null;
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()}`;
  return `$${Number(min || max).toLocaleString()}+`;
}

export default function JobCard({ job, footer }) {
  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div className="job-card">
      <div className="job-card-top">
        <div>
          <p className="job-card-company">{job.company}</p>
          <h3 className="job-card-title">
            <Link to={`/jobs/${job.id}`}>{job.title}</Link>
          </h3>
        </div>
        {job.status && <StatusStamp status={job.status} />}
      </div>

      <div className="job-card-meta">
        <span>{job.location}</span>
        <span className="dot">•</span>
        <span>{job.job_type}</span>
        {salary && (
          <>
            <span className="dot">•</span>
            <span>{salary}</span>
          </>
        )}
      </div>

      {job.skills && (
        <div className="job-card-skills">
          {job.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6).map((skill) => (
            <span className="skill-pill" key={skill}>{skill}</span>
          ))}
        </div>
      )}

      {footer && <div className="job-card-footer">{footer}</div>}
    </div>
  );
}
