import React from 'react';
import { AlertCircle } from 'lucide-react';

export function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[16px] font-semibold text-[#0F172A]"
        >
          {label}
          {required && <span className="text-[#E53E3E] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && <Icon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full min-h-[52px] py-3 text-[16px] ${Icon ? 'pl-11 pr-4' : 'px-4'} text-[#0F172A] bg-white border rounded-lg transition-colors placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 disabled:bg-[#F6F8FA] disabled:cursor-not-allowed ${
            error
              ? 'border-[#E53E3E] focus:ring-[#E53E3E] focus:border-[#E53E3E]'
              : 'border-[#E2E8F0] focus:ring-[#008BC5] focus:border-[#008BC5]'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-[#E53E3E] text-[14px] font-medium pt-0.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[14px] text-[#64748B] pt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}