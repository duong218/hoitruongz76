import React, { useId } from 'react';

export function Switch({
  checked = false,
  onChange,
  label,
  id,
  disabled = false,
}) {
  const autoId = useId();
  const switchId = id || autoId;

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={`relative inline-flex items-center min-w-[56px] h-8 w-14 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#008BC5] focus:ring-offset-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
          checked ? 'bg-[#008BC5]' : 'bg-[#CBD5E1]'
        }`}
      >
        <span
          className={`inline-block w-6 h-6 transform bg-white rounded-full shadow-[0_1px_3px_rgba(15,23,42,0.15)] transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>

      <label
        htmlFor={switchId}
        className="cursor-pointer text-[16px] font-medium text-[#0F172A] flex items-center gap-2 select-none"
      >
        {label && <span>{label}</span>}
        <span
          className={`font-semibold ${
            checked ? 'text-[#008BC5]' : 'text-[#64748B]'
          }`}
        >
          {checked ? 'Đang bật' : 'Đang tắt'}
        </span>
      </label>
    </div>
  );
}
