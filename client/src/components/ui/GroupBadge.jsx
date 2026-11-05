import React from 'react';

export function GroupBadge({
  name,
  color,
  className = '',
  size = 'md',
}) {
  const isLarge = size === 'lg';

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg select-none ${
        isLarge ? 'text-[16px] font-semibold' : 'text-[14px] font-medium'
      } text-[#0F172A] ${className}`}
    >
      <span
        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-[0_0_1px_rgba(0,0,0,0.2)]"
        style={{ backgroundColor: color || '#64748B' }}
      />
      <span className="truncate max-w-[200px]">{name || 'Chưa phân nhóm'}</span>
    </span>
  );
}
