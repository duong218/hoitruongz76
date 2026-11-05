import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
  };

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          borderLeft: 'border-l-4 border-l-[#22C55E]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />,
          title: 'Thành công',
        };
      case 'error':
        return {
          borderLeft: 'border-l-4 border-l-[#E53E3E]',
          icon: <AlertCircle className="w-5 h-5 text-[#E53E3E] shrink-0" />,
          title: 'Lỗi',
        };
      case 'warning':
        return {
          borderLeft: 'border-l-4 border-l-[#F6AD37]',
          icon: <AlertTriangle className="w-5 h-5 text-[#F6AD37] shrink-0" />,
          title: 'Lưu ý',
        };
      case 'info':
      default:
        return {
          borderLeft: 'border-l-4 border-l-[#008BC5]',
          icon: <Info className="w-5 h-5 text-[#008BC5] shrink-0" />,
          title: 'Thông báo',
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <aside
        aria-label="Thông báo hệ thống"
        className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[200] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const style = getToastStyle(t.type);
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto bg-white rounded-lg border border-[#E2E8F0] ${style.borderLeft} p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-start gap-3 transition-all duration-200`}
            >
              <div className="pt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#0F172A]">{style.title}</p>
                <p className="text-[16px] text-[#334155] leading-snug break-words">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] rounded focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
                aria-label="Đóng thông báo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
