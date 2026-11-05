import React from 'react';
import { Button } from './Button.jsx';

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  onAction,
  actionIcon,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-xl bg-[#F6F8FA] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-[18px] font-bold text-[#0F172A]">{title}</h3>
      {description && (
        <p className="mt-2 text-[16px] text-[#64748B] max-w-md leading-normal">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <div className="mt-5">
          <Button
            variant="primary"
            onClick={onAction}
            icon={actionIcon}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
