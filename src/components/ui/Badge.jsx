import React from 'react';

export function Badge({
  children,
  variant = 'neutral',
  icon: Icon,
  className = '',
}) {
  const variantStyles = {
    success: 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]',
    warning: 'bg-[#FEF9EE] text-[#B45309] border-[#FDE68A]',
    error: 'bg-[#FEECEC] text-[#B91C1C] border-[#FECACA]',
    info: 'bg-[#EAF6FF] text-[#008BC5] border-[#BAE6FD]',
    neutral: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
  }[variant] || 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[14px] font-semibold border rounded-md leading-none select-none ${variantStyles} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
