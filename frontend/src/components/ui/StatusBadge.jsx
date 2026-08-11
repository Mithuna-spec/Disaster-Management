import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  const getStyles = () => {
    const val = String(status || '').toUpperCase();
    
    if (type === 'status' || type === 'task') {
      switch (val) {
        case 'PENDING':
        case 'PENDING_ACCEPTANCE':
          return 'bg-[#D4A373]/15 text-[#B88555] border-[#D4A373]/30';
        case 'ASSIGNED':
        case 'ACTIVE':
          return 'bg-[#607D6C]/10 text-[#607D6C] border-[#607D6C]/25';
        case 'IN_PROGRESS':
          return 'bg-[#D4A373]/10 text-[#B88555] border-[#D4A373]/25';
        case 'COMPLETED':
        case 'RESOLVED':
        case 'HEALTHY':
          return 'bg-[#607D6C]/15 text-[#4F6759] border-[#607D6C]/35';
        case 'REJECTED':
        case 'CANCELLED':
        case 'DEPLETED':
          return 'bg-[#C26D5C]/15 text-[#C26D5C] border-[#C26D5C]/30';
        default:
          return 'bg-brand-bg text-[#2C3531] border-brand-border';
      }
    }
    
    if (type === 'priority') {
      switch (val) {
        case 'CRITICAL':
          return 'bg-[#C26D5C]/20 text-[#C26D5C] font-extrabold border-[#C26D5C]/40 animate-pulse';
        case 'HIGH':
          return 'bg-[#D4A373]/20 text-[#B88555] font-bold border-[#D4A373]/40';
        case 'MEDIUM':
          return 'bg-[#607D6C]/10 text-[#607D6C] border-[#607D6C]/30';
        case 'LOW':
          return 'bg-brand-bg text-brand-text-secondary border-brand-border';
        default:
          return 'bg-brand-bg text-brand-text-muted border-brand-border';
      }
    }

    if (type === 'role') {
      switch (val) {
        case 'ADMIN':
          return 'bg-[#607D6C]/15 text-[#4F6759] font-bold border-[#607D6C]/25';
        case 'VOLUNTEER':
          return 'bg-[#D4A373]/15 text-[#B88555] font-bold border-[#D4A373]/25';
        case 'BENEFICIARY':
          return 'bg-brand-bg text-[#2C3531] border-brand-border';
        default:
          return 'bg-brand-bg text-brand-text-secondary border-brand-border';
      }
    }

    return 'bg-brand-bg text-[#2C3531] border-brand-border';
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStyles()}`}>
      {status ? status.replace('_', ' ') : 'N/A'}
    </span>
  );
}
