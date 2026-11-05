import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[48px] min-w-[44px] touch-manipulation cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 select-none';

  const sizeClasses = {
    sm: 'px-4 py-2 text-[14px]',
    md: 'px-5 py-3 text-[16px]',
    lg: 'px-6 py-3.5 text-[18px]',
  }[size] || 'px-5 py-3 text-[16px]';

  const variantClasses = {
    primary:
      'bg-[#008BC5] text-white hover:bg-[#0072A3] active:bg-[#005C85] focus:ring-[#008BC5] border border-transparent shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
    secondary:
      'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F6F8FA] active:bg-[#E2E8F0] focus:ring-[#008BC5]',
    danger:
      'bg-[#E53E3E] text-white hover:bg-[#C53030] active:bg-[#9B2C2C] focus:ring-[#E53E3E] border border-transparent shadow-[0_1px_3px_rgba(15,23,42,0.08)]',
    ghost:
      'bg-transparent text-[#008BC5] hover:bg-[#EAF6FF] active:bg-[#D4EDFF] focus:ring-[#008BC5] border border-transparent',
  }[variant] || '';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Đang xử lý...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          {Icon && iconPosition === 'left' && <Icon className="w-5 h-5 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-5 h-5 shrink-0" />}
        </span>
      )}
    </button>
  );
}
