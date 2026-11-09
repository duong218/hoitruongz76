import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    isDanger: false,
    checkbox: null,
  });
  const [checked, setChecked] = useState(false);

  const resolverRef = useRef(null);

  const confirm = ({
    title = 'Xác nhận hành động',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    isDanger = false,
    checkbox = null, // { label, defaultChecked, hint } — có thì khi đồng ý trả về { checked }
  }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setChecked(!!checkbox?.defaultChecked);
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        checkbox,
      });
    });
  };

  const handleClose = (result) => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(result && dialogState.checkbox ? { checked } : result);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogState.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          data-lenis-prevent className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-none"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  dialogState.isDanger
                    ? 'bg-[#FEECEC] text-[#E53E3E]'
                    : 'bg-[#EAF6FF] text-[#008BC5]'
                }`}
              >
                {dialogState.isDanger ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  id="confirm-dialog-title"
                  className="text-[18px] font-bold text-[#0F172A] leading-tight"
                >
                  {dialogState.title}
                </h2>
                <p className="mt-2 text-[16px] text-[#334155] leading-normal whitespace-pre-line">
                  {dialogState.message}
                </p>
              </div>
            </div>

            {dialogState.checkbox && (
              <label className="flex items-start gap-3 p-3 border border-[#E2E8F0] rounded-lg bg-[#F6F8FA] cursor-pointer min-h-[48px]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#008BC5] shrink-0"
                />
                <span className="text-[16px] text-[#0F172A] font-semibold leading-snug">
                  {dialogState.checkbox.label}
                  {dialogState.checkbox.hint && (
                    <span className="block text-[14px] font-normal text-[#334155] mt-1">
                      {checked ? dialogState.checkbox.hint[1] : dialogState.checkbox.hint[0]}
                    </span>
                  )}
                </span>
              </label>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="w-full sm:w-auto min-h-[48px] px-5 py-3 text-[16px] font-medium text-[#334155] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F6F8FA] active:bg-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#008BC5] transition-colors"
              >
                {dialogState.cancelText}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`w-full sm:w-auto min-h-[48px] px-5 py-3 text-[16px] font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  dialogState.isDanger
                    ? 'bg-[#E53E3E] hover:bg-[#C53030] active:bg-[#9B2C2C] focus:ring-[#E53E3E]'
                    : 'bg-[#008BC5] hover:bg-[#0072A3] active:bg-[#005C85] focus:ring-[#008BC5]'
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}