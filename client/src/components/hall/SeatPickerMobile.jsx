import React, { useEffect, useState } from 'react';
import { TOTAL_ROWS, SEATS_PER_SIDE, seatId, isVipRow, parseSeatId } from '../../constants/hall.js';

/**
 * Chọn ghế cho ĐIỆN THOẠI / MÁY TÍNH BẢNG (thay HallMap ở chế độ gán chỗ khi màn hình < lg).
 * Bước 1: chạm 1 hàng. Bước 2: chạm 1 ghế trong dải 2 x 10 ô to (ô nào cũng >= 28px).
 * Màu ô = màu nhóm của người đang ngồi; xám = ghế trống; ✓ = đã điểm danh.
 */
const NUMS = Array.from({ length: SEATS_PER_SIDE }, (_, i) => i + 1);

export function SeatPickerMobile({ seatGroups, colorOf, ownerOf, nameOf, attended, sel, onPick, selRows, onToggleRow }) {
  const [row, setRow] = useState(1);
  useEffect(() => {
    const r = sel && parseSeatId(sel)?.row;
    if (r) setRow(r);
  }, [sel]);

  const ids = (r, side) => NUMS.map((n) => seatId(r, side, n));
  const used = (r) => [...ids(r, 'L'), ...ids(r, 'R')].filter((id) => seatGroups[id]).length;
  const total = SEATS_PER_SIDE * 2;
  const rowSelected = selRows.includes(row);

  const strip = (side) => {
    const order = side === 'L' ? [...NUMS].reverse() : NUMS;
    const ends = side === 'L' ? ['Tường', 'Lối đi'] : ['Lối đi', 'Tường'];
    return (
      <div key={side}>
        <div className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-[#64748B]">
          <span>{ends[0]}</span>
          <span className="text-[13px] text-[#0F172A]">Bên {side === 'L' ? 'trái' : 'phải'}</span>
          <span>{ends[1]}</span>
        </div>
        <div className="grid grid-cols-10 gap-1">
          {order.map((n) => {
            const id = seatId(row, side, n);
            const color = seatGroups[id] ? colorOf(seatGroups[id]) : null;
            const who = ownerOf.get(id);
            const isSel = sel === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPick(id)}
                aria-pressed={isSel}
                aria-label={`Ghế ${n} bên ${side === 'L' ? 'trái' : 'phải'}, ${who ? nameOf.get(who) || who : color ? 'khách mời' : 'trống'}${attended.has(id) ? ', đã điểm danh' : ''}`}
                className="relative flex h-11 items-center justify-center rounded-md text-[14px] font-bold tabular-nums cursor-pointer"
                style={{
                  background: color || '#EEF2F6',
                  color: color ? '#fff' : '#64748B',
                  boxShadow: isSel ? '0 0 0 2px #fff, 0 0 0 4px #0F172A' : undefined,
                }}
              >
                {n}
                {attended.has(id) && <span aria-hidden="true" className="absolute right-0.5 top-0 text-[9px] leading-3">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
      <div className="rounded-xl bg-[#0F172A] py-2 text-center text-[12px] font-bold tracking-[0.2em] text-white">SÂN KHẤU</div>

      <div className="grid grid-cols-5 gap-1.5" role="tablist" aria-label="Chọn hàng ghế">
        {Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={r === row}
            onClick={() => setRow(r)}
            className={`flex min-h-[52px] flex-col items-center justify-center rounded-lg border text-center cursor-pointer ${r === row ? 'border-[#008BC5] bg-[#EAF6FF]' : 'border-[#E2E8F0] bg-white'}`}
          >
            <span className={`text-[16px] font-extrabold leading-5 ${isVipRow(r) ? 'text-[#B45309]' : 'text-[#0F172A]'}`}>Hàng {r}</span>
            <span className="text-[12px] leading-4 text-[#475569]">{used(r)}/{total}{selRows.includes(r) ? ' ✓' : ''}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[16px] font-bold text-[#0F172A]">
          Hàng {row} {isVipRow(row) && <span className="ml-1 rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309]">VIP</span>}
        </p>
        <button
          type="button"
          onClick={() => onToggleRow(row)}
          className={`min-h-[44px] rounded-lg border px-3 text-[14px] font-bold cursor-pointer ${rowSelected ? 'border-[#008BC5] bg-[#008BC5] text-white' : 'border-[#CBD5E1] bg-white text-[#334155]'}`}
        >
          {rowSelected ? 'Bỏ chọn cả hàng' : 'Chọn cả hàng'}
        </button>
      </div>

      {strip('L')}
      {strip('R')}

      <p className="text-[13px] leading-5 text-[#475569]">Ô xám là ghế trống, ô có màu là ghế đã có người, dấu ✓ là đã điểm danh. Chạm ô ghế để gán.</p>
    </div>
  );
}