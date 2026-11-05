import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

/**
 * Custom Dropdown Select:
 * - Menu thả xuống tự tùy biến bằng React (không dùng menu native của OS/trình duyệt)
 * - Khớp chiều rộng 100% với ô bấm (w-full), không bị bè to tràn ra ngoài
 * - Giới hạn chiều cao max-h-60 kèm cuộn mượt (overflow-y-auto)
 * - Hiệu ứng bo góc, đổ bóng đẹp mắt, icon tích chọn mục đang chọn
 * - Tự động đóng khi click ra ngoài hoặc bấm phím Escape
 */
export function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = '-- Chọn --',
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  containerClassName = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  children,
}) {
  const autoId = useId();
  const selectId = id || autoId;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Chuẩn hóa danh sách options từ props options hoặc children (thẻ <option> hoặc <optgroup>)
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options;
    }
    const list = [];
    React.Children.forEach(children, (child) => {
      if (!child) return;
      if (child.type === 'optgroup') {
        const groupLabel = child.props.label;
        React.Children.forEach(child.props.children, (opt) => {
          if (!opt) return;
          list.push({
            value: opt.props.value,
            label: opt.props.children,
            group: groupLabel,
            disabled: opt.props.disabled,
          });
        });
      } else if (child.type === 'option') {
        list.push({
          value: child.props.value,
          label: child.props.children,
          disabled: child.props.disabled,
        });
      }
    });
    return list;
  }, [options, children]);

  // Tìm label của item đang được chọn
  const selectedItem = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Đóng khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'min-h-[40px] text-[14px] px-3 py-1.5',
    md: 'min-h-[46px] text-[15px] px-3.5 py-2.5',
    lg: 'min-h-[50px] text-[16px] px-4 py-3',
  }[size] || 'min-h-[46px] text-[15px] px-3.5 py-2.5';

  const handleSelect = (val, isDisabled) => {
    if (isDisabled || disabled) return;
    if (onChange) {
      // Giả lập event change để tương thích 100% với onChange(e) hoặc onChange(val)
      const syntheticEvent = {
        target: { id: selectId, value: val },
        currentTarget: { id: selectId, value: val },
      };
      onChange(syntheticEvent);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`w-full space-y-1.5 relative ${containerClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="block text-[14px] font-semibold text-[#334155] select-none truncate cursor-pointer"
        >
          {label}
          {required && <span className="text-[#E53E3E] ml-1">*</span>}
        </label>
      )}

      {/* Nút bấm mở dropdown */}
      <div className="relative w-full">
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full max-w-full flex items-center justify-between gap-2 bg-white text-left font-medium border rounded-lg transition-all focus:outline-none focus:ring-2 select-none ${sizeClasses} ${
            disabled
              ? 'bg-[#F8FAFC] cursor-not-allowed text-[#94A3B8] border-[#E2E8F0]'
              : isOpen
              ? 'border-[#008BC5] ring-2 ring-[#008BC5]/20 shadow-sm'
              : error
              ? 'border-[#E53E3E] text-[#0F172A]'
              : 'border-[#CBD5E1] hover:border-[#94A3B8] text-[#0F172A]'
          } ${className}`}
        >
          <span className="truncate flex-1">
            {selectedItem ? selectedItem.label : <span className="text-[#94A3B8]">{placeholder}</span>}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 stroke-[2.2] ${
              isOpen ? 'rotate-180 text-[#008BC5]' : ''
            }`}
          />
        </button>

        {/* Menu danh sách sổ xuống (Custom Popup) */}
        {isOpen && !disabled && (
          <div
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1.5 w-full bg-white border border-[#CBD5E1] rounded-xl shadow-[0_10px_25px_-5px_rgba(15,23,42,0.15),0_8px_10px_-6px_rgba(15,23,42,0.1)] py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
          >
            {parsedOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-[14px] text-[#94A3B8] text-center">
                Không có lựa chọn nào
              </div>
            ) : (
              parsedOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const prevOpt = parsedOptions[index - 1];
                const showGroupHeader = opt.group && (!prevOpt || prevOpt.group !== opt.group);

                return (
                  <React.Fragment key={opt.value + '-' + index}>
                    {showGroupHeader && (
                      <div className="px-3 pt-2 pb-1 text-[12px] font-bold text-[#64748B] uppercase tracking-wider bg-[#F8FAFC] border-y border-[#F1F5F9] first:border-t-0">
                        {opt.group}
                      </div>
                    )}
                    <div
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                      className={`flex items-center justify-between px-3.5 py-2.5 text-[14px] cursor-pointer transition-colors ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed bg-transparent'
                          : isSelected
                          ? 'bg-[#EAF6FF] text-[#008BC5] font-semibold'
                          : 'text-[#0F172A] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#008BC5] shrink-0 stroke-[2.5]" />}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[13px] text-[#E53E3E] flex items-center gap-1 font-medium mt-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[13px] text-[#64748B] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
