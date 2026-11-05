import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-4 sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
