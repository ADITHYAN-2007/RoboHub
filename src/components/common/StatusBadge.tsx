import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const normalized = status.toUpperCase();

  let dotColor = 'bg-slate-400';
  let textColor = 'text-slate-400';

  if (['AVAILABLE', 'APPROVED', 'COMPLETED', 'ACTIVE', 'RESOLVED', 'NEW'].includes(normalized)) {
    dotColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
  } else if (['IN_USE', 'IN_PROGRESS', 'TESTING', 'SCHEDULED', 'ISSUED'].includes(normalized)) {
    dotColor = 'bg-cyan-500';
    textColor = 'text-cyan-400';
  } else if (['PENDING', 'PROPOSED', 'UNDER_MAINTENANCE', 'PARTIALLY_APPROVED', 'LOW'].includes(normalized)) {
    dotColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  } else if (['REJECTED', 'CANCELLED', 'DAMAGED', 'DAMAGED_RETURN', 'LOST', 'RETIRED', 'HIGH', 'CRITICAL', 'OVERDUE'].includes(normalized)) {
    dotColor = 'bg-rose-500';
    textColor = 'text-rose-400';
  }

  const formatText = (str: string) => {
    return str.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase ${textColor} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />}
      <span>{formatText(status)}</span>
    </span>
  );
};
