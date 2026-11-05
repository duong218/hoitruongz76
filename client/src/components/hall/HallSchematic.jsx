import React, { useMemo } from 'react';
import { ArrowUp, Armchair } from 'lucide-react';
import { TOTAL_ROWS, isVipRow } from '../../constants/hall.js';
import { formatSeatRanges } from '../../utils/seatSummary.js';

// Sơ đồ rút gọn cho điện thoại: mỗi hàng 1 dòng, mỗi bên 1 ô, chữ to.
// Sân khấu ở trên, Cửa vào ở dưới (giống sơ đồ 2D). Cột giữa là lối đi.
function Block({ nums, color, side }) {
  // Bên trái: ghế 10 sát tường (trái) -> ghế 1 sát lối đi. Bên phải ngược lại.
  const order = Array.from({ length: 10 }, (_, i) => (side === 'L' ? 10 - i : i + 1));
  const set = new Set(nums);
  const mine = nums.length > 0;
  return (
    <div
      className={`min-h-[56px] rounded-lg px-2 py-1.5 flex flex-col justify-center gap-1.5 ${
        mine ? 'border-2 bg-white' : 'border border-[#E2E8F0] bg-[#F6F8FA]'
      }`}
      style={mine ? { borderColor: color, background: `color-mix(in srgb, ${color} 10%, white)` } : undefined}
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

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-3 space-y-3">
      {rowCount > 0 && (
        <div className="rounded-lg bg-[#EAF6FF] p-3 space-y-2 text-[17px] leading-7 text-[#0F172A]">
          <p className="flex items-start gap-2">
            <ArrowUp className="w-6 h-6 shrink-0 mt-0.5 text-[#008BC5]" />
            <span>
              Từ <strong>Cửa vào</strong>, đi thẳng lên theo <strong>lối đi giữa</strong>, rồi rẽ vào hàng của bạn.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Armchair className="w-6 h-6 shrink-0 mt-0.5 text-[#008BC5]" />
            <span>
              Khối của bạn có chỗ ở <strong>{rowCount} hàng</strong> (khung màu bên dưới). Bạn ngồi <strong>ghế trống bất kỳ</strong> trong các khung này.
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-[3.75rem_1fr_1rem_1fr]">
        <div className="col-span-4 mb-2 rounded-lg bg-[#0F172A] py-2.5 text-center text-[16px] font-bold text-white">
          SÂN KHẤU
        </div>

        <span />
        <span className="text-center text-[14px] font-semibold text-[#334155]">Bên trái</span>
        <span />
        <span className="text-center text-[14px] font-semibold text-[#334155]">Bên phải</span>

        {rows.map((r) => {
          const row = mine[r];
          return (
            <React.Fragment key={r}>
              <div className="flex flex-col justify-center py-1">
                <span className={`text-[16px] leading-5 ${row ? 'font-bold text-[#0F172A]' : 'font-semibold text-[#334155]'}`}>
                  Hàng {r}
                </span>
                {isVipRow(r) && <span className="text-[14px] leading-4 font-semibold text-[#B45309]">VIP</span>}
              </div>
              <div className="py-1"><Block nums={row?.L || []} color={color} side="L" /></div>
              {/* Lối đi giữa */}
              <div className="flex justify-center"><span className="border-l-2 border-dashed border-[#CBD5E1]" /></div>
              <div className="py-1"><Block nums={row?.R || []} color={color} side="R" /></div>
            </React.Fragment>
          );
        })}

        <div className="col-span-4 mt-2 rounded-lg bg-[#334155] py-2.5 text-center text-[16px] font-bold text-white">
          CỬA VÀO ↑
        </div>
      </div>
    </div>
  );
}