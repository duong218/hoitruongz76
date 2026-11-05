import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottomsheet-title"
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 sm:hidden"
      onClick={onClose}
    >
      <div
        className={`w-full bg-white rounded-t-2xl border-t border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] max-h-[88vh] flex flex-col pb-[env(safe-area-inset-bottom,16px)] animate-in slide-in-from-bottom duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-[#CBD5E1]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0]">
          <h2 id="bottomsheet-title" className="text-[18px] font-bold text-[#0F172A] truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng trượt"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
