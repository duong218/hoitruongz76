import React, { useMemo } from 'react';
import { TOTAL_ROWS, SEATS_PER_SIDE, seatId } from '../../constants/hall.js';
import { formatSeatRanges } from '../../utils/seatSummary.js';

// Sơ đồ thu nhỏ để xem trước vị trí các ghế đang chọn trong SeatRowEditor.
// Giống sơ đồ thật: Sân khấu ở trên, Cửa vào ở dưới, hàng 1 sát sân khấu.
// Bên trái: ghế 10 sát tường -> ghế 1 sát lối đi giữa; bên phải ngược lại.
const ROWS = Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1);
const ORDER_L = Array.from({ length: SEATS_PER_SIDE }, (_, i) => SEATS_PER_SIDE - i);
const ORDER_R = Array.from({ length: SEATS_PER_SIDE }, (_, i) => i + 1);
const PICK_STYLE = { outline: '2px solid #0F172A', outlineOffset: '1px' };

export function SeatPreviewMap({ row, selectedSeatIds = [], seatGroups = {}, groups = [] }) {
  const colorOf = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.color])), [groups]);
  const picked = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);

  const nums = (side) =>
    selectedSeatIds
      .filter((id) => id.startsWith(`${row}-${side}-`))
      .map((id) => Number(id.split('-')[2]))
      .sort((a, b) => a - b);
  const left = nums('L');
  const right = nums('R');

  const seat = (r, side, n) => {
    const id = seatId(r, side, n);
    return (
      <span
        key={id}
        className="flex-1 h-full rounded-[2px]"
        style={{ background: colorOf[seatGroups[id]] || '#E2E8F0', ...(picked.has(id) ? PICK_STYLE : null) }}
      />
    );
  };

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-[#0F172A]">Xem trước vị trí</span>
        <span className="flex items-center gap-1 text-[12px] text-[#64748B]">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#E2E8F0]" style={PICK_STYLE} aria-hidden="true" />
          Đang chọn
        </span>
      </div>

      <div className="rounded bg-[#0F172A] py-0.5 text-center text-[11px] font-bold text-white">SÂN KHẤU</div>

      <div className="space-y-[3px]" aria-hidden="true">
        {ROWS.map((r) => {
          const current = r === row;
          return (
            <div
              key={r}
              className={`flex items-center gap-1.5 rounded px-1 py-[3px] ${current ? 'bg-[#EAF6FF] ring-1 ring-[#008BC5]' : ''}`}
            >
              <span className={`w-4 shrink-0 text-right text-[11px] leading-none ${current ? 'font-bold text-[#008BC5]' : 'text-[#64748B]'}`}>{r}</span>
              <div className="flex flex-1 gap-[3px] h-2.5 sm:h-3 xl:h-4">{ORDER_L.map((n) => seat(r, 'L', n))}</div>
              <span className="w-1.5 shrink-0 self-stretch border-l border-dashed border-[#CBD5E1]" />
              <div className="flex flex-1 gap-[3px] h-2.5 sm:h-3 xl:h-4">{ORDER_R.map((n) => seat(r, 'R', n))}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded bg-[#334155] py-0.5 text-center text-[11px] font-bold text-white">CỬA VÀO ↑</div>

      <p aria-live="polite" className="text-[13px] leading-snug text-[#334155]">
        {selectedSeatIds.length === 0 ? (
          'Bấm chọn ghế để xem vị trí trên sơ đồ.'
        ) : (
          <>
            <strong className="text-[#0F172A]">Hàng {row}</strong>
            {left.length > 0 && <span className="block">Bên trái: {formatSeatRanges(left)}</span>}
            {right.length > 0 && <span className="block">Bên phải: {formatSeatRanges(right)}</span>}
          </>
        )}
      </p>
    </div>
  );
}