import React, { useMemo } from 'react';
import { ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { TOTAL_ROWS, isVipRow } from '../../constants/hall.js';
import { formatSeatRanges } from '../../utils/seatSummary.js';

// Sơ đồ rút gọn cho điện thoại: mỗi hàng 1 dòng, mỗi bên 1 ô, chữ to.
// Sân khấu ở trên, Cửa vào ở dưới (giống sơ đồ 2D). Cột giữa là lối đi.
function Block({ nums, color, side, delay = 0 }) {
  // Bên trái: ghế 10 sát tường (trái) -> ghế 1 sát lối đi. Bên phải ngược lại.
  const order = Array.from({ length: 10 }, (_, i) => (side === 'L' ? 10 - i : i + 1));
  const set = new Set(nums);
  const mine = nums.length > 0;
  return (
    <div
      className={`h-full rounded-lg px-2 py-1 flex flex-col justify-center gap-1 ${
        mine ? 'border-2 bg-white fade-in-up' : 'border border-[#E2E8F0] bg-[#F6F8FA]'
      }`}
      style={mine ? { borderColor: color, background: `color-mix(in srgb, ${color} 10%, white)`, '--stagger-delay': `${delay}ms` } : undefined}
    >
      <div className="flex gap-[3px]" aria-hidden="true">
        {order.map((n) => (
          <span
            key={n}
            className={`flex-1 rounded-[3px] ${mine ? 'h-2.5' : 'h-2'}`}
            style={{ background: set.has(n) ? color : mine ? '#CBD5E1' : '#E2E8F0' }}
          />
        ))}
      </div>
      {mine && (
        <span className="text-[16px] font-bold leading-5 text-center text-[#0F172A]">
          {nums.length === 10 ? 'Cả bên này' : formatSeatRanges(nums)}
        </span>
      )}
    </div>
  );
}

export function HallSchematic({ seatGroups = {}, highlightGroupId = null, color = '#008BC5' }) {
  const mine = useMemo(() => {
    const m = {}; // { [row]: { L: [], R: [] } }
    Object.entries(seatGroups).forEach(([id, g]) => {
      if (g !== highlightGroupId) return;
      const [r, side, n] = id.split('-');
      (m[+r] ||= { L: [], R: [] })[side]?.push(+n);
    });
    Object.values(m).forEach((v) => { v.L.sort((a, b) => a - b); v.R.sort((a, b) => a - b); });
    return m;
  }, [seatGroups, highlightGroupId]);

  const rows = Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1);
  const rowCount = Object.keys(mine).length;
  // Đường chỉ dẫn chảy từ Cửa vào lên tới hàng xa nhất (số nhỏ nhất) của nhóm
  const farthest = rowCount ? Math.min(...Object.keys(mine).map(Number)) : null;
  let order = 0; // thứ tự hiện dần các khung

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-2.5 space-y-2">
      <div className="grid grid-cols-[3.75rem_1fr_2rem_1fr]">
        <div className="col-span-4 mb-1 rounded-lg bg-[#0F172A] py-1.5 text-center text-[16px] font-bold text-white">
          SÂN KHẤU
        </div>

        <span />
        <span className="text-center text-[14px] font-semibold text-[#334155]">Bên trái</span>
        <span />
        <span className="text-center text-[14px] font-semibold text-[#334155]">Bên phải</span>

        {rows.map((r) => {
          const row = mine[r];
          const flowing = farthest !== null && r >= farthest;
          const hasL = !!row?.L.length;
          const hasR = !!row?.R.length;
          return (
            <React.Fragment key={r}>
              <div className="flex h-12 flex-col justify-center">
                <span className={`text-[16px] leading-5 ${row ? 'font-bold text-[#0F172A]' : 'font-semibold text-[#334155]'}`}>
                  Hàng {r}
                </span>
                {isVipRow(r) && <span className="text-[14px] leading-4 font-semibold text-[#B45309]">VIP</span>}
              </div>
              <div className="h-12 py-0.5"><Block nums={row?.L || []} color={color} side="L" delay={hasL ? 150 + 90 * order++ : 0} /></div>
              {/* Lối đi giữa: đường nét đứt chảy lên tới hàng của nhóm, mũi tên chỉ vào khung */}
              <div className="relative h-12 overflow-hidden" aria-hidden="true">
                {flowing ? (
                  <span
                    className="aisle-flow absolute left-1/2 top-0 -ml-0.5 h-[calc(100%+16px)] w-1 rounded-full"
                    style={{ background: `repeating-linear-gradient(to bottom, ${color} 0 8px, transparent 8px 16px)` }}
                  />
                ) : (
                  <span className="absolute left-1/2 top-0 -ml-px h-full border-l-2 border-dashed border-[#CBD5E1]" />
                )}
                {hasL && (
                  <ChevronLeft
                    className="arrow-nudge-l absolute top-1/2 -mt-[9px] h-[18px] w-[18px] right-1/2 mr-[1px]"
                    style={{ color }}
                    strokeWidth={3.5}
                  />
                )}
                {hasR && (
                  <ChevronRight
                    className="arrow-nudge-r absolute top-1/2 -mt-[9px] h-[18px] w-[18px] left-1/2 ml-[1px]"
                    style={{ color }}
                    strokeWidth={3.5}
                  />
                )}
              </div>
              <div className="h-12 py-0.5"><Block nums={row?.R || []} color={color} side="R" delay={hasR ? 150 + 90 * order++ : 0} /></div>
            </React.Fragment>
          );
        })}

        <div className="col-span-4 mt-1 rounded-lg bg-[#334155] py-1.5 text-center text-[16px] font-bold text-white">
          CỬA VÀO ↑
        </div>
      </div>

      {rowCount > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-[#EAF6FF] px-3 py-2 text-[15px] leading-5 text-[#0F172A] fade-in-up">
          <ArrowUp className="w-5 h-5 shrink-0 text-[#008BC5]" />
          <span>Từ <strong>Cửa vào</strong> đi thẳng lên lối giữa, rẽ vào <strong>khung màu</strong> của bạn ({rowCount} hàng), ngồi ghế trống bất kỳ.</span>
        </p>
      )}
    </div>
  );
}