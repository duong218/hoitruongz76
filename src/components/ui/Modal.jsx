import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
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
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] my-8 overflow-hidden transform transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 id="modal-headline" className="text-[18px] sm:text-[20px] font-bold text-[#0F172A] truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F8FA] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
