import React from 'react';
import { Check } from 'lucide-react';
import { GROUP_COLOR_PALETTE } from '../../constants/hall.js';

export function ColorSwatchPicker({
  selectedColor,
  onChange,
  disabled = false,
  label = 'Màu đại diện nhóm',
}) {
  return (
    <div className="space-y-2">
      {label && (
        <span className="block text-[16px] font-semibold text-[#0F172A]">
          {label}
        </span>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {GROUP_COLOR_PALETTE.map((swatch) => {
          const isSelected = selectedColor?.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(swatch.hex)}
              aria-label={`Chọn màu ${swatch.label}`}
              aria-pressed={isSelected}
              title={swatch.label}
              style={{ backgroundColor: swatch.hex }}
              className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg transition-transform focus:outline-none focus:ring-2 focus:ring-[#008BC5] focus:ring-offset-2 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed ${
                isSelected
                  ? 'ring-2 ring-[#0F172A] ring-offset-2 scale-105'
                  : 'hover:scale-105 opacity-90 hover:opacity-100'
              }`}
            >
              {isSelected && <Check className="w-6 h-6 text-white stroke-[3]" />}
            </button>
          );
        })}
      </div>
      <p className="text-[14px] text-[#64748B]">
        Chọn màu đại diện quy định. Màu này sẽ hiển thị trực quan trên sơ đồ ghế hội trường.
      </p>
    </div>
  );
}
