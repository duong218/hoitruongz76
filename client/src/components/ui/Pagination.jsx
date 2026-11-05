import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';

export function Pagination({ page, pages, total, limit, onChange, disabled = false }) {
  if (!total || total <= limit) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-[16px] text-[#64748B]">
        Hiển thị <strong className="text-[#0F172A]">{start}–{end}</strong> trên{' '}
        <strong className="text-[#0F172A]">{total}</strong> dòng
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
          Trước
        </Button>
        <span className="px-2 text-[16px] font-semibold text-[#334155] tabular-nums">
          {page} / {pages}
        </span>
        <Button variant="secondary" size="sm" icon={ChevronRight} iconPosition="right" disabled={disabled || page >= pages} onClick={() => onChange(page + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}
