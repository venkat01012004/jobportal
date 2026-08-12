import React from 'react';

const LABELS = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
  open: 'Open',
  closed: 'Closed'
};

export default function StatusStamp({ status }) {
  const cls = `stamp stamp-${status}`;
  return <span className={cls}>{LABELS[status] || status}</span>;
}
