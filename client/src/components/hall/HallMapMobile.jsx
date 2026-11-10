import React, { useEffect, useMemo, useState } from 'react';
import { TOTAL_ROWS, isVipRow, seatId, parseSeatId, MY_SEAT_COLOR } from '../../constants/hall.js';

/**
 * Sơ đồ hội trường cho ĐIỆN THOẠI (thay HallSchematic).
 * 1) Tổng quan: SVG vẽ ĐÚNG 1 viewBox rộng 360 => gần như 1:1 trên màn hình 360-430px,
 *    không bị thu nhỏ như sơ đồ 940px nên chữ/hàng luôn rõ. Mỗi ghế là 1 ô, hàng của nhóm
 *    được tô nền + số hàng dạng "viên thuốc", đường chỉ dẫn từ Cửa vào chạy theo lối giữa.
 * 2) Chi tiết: chạm 1 hàng => hiện dải ghế phóng to có số ghế (1-10) mỗi bên.
 */
const W = 360;
const PAD = 10;
const LABEL = 28;
const AISLE = 24;
const P = (W - PAD * 2 - LABEL - AISLE) / 20; // bước ghế ~14.4
const SEAT_W = P - 2.4;
const SEAT_H = 17;
const ROW_P = 27;
const TOP = 66;
const LEFT_X = PAD + LABEL;
const RIGHT_X = LEFT_X + 10 * P + AISLE;
const AISLE_X = LEFT_X + 10 * P + AISLE / 2;
const ENT_Y = TOP + (TOTAL_ROWS - 1) * ROW_P + SEAT_H + 22;
const H = ENT_Y + 30 + 8;

const seatX = (side, n) => (side === 'L' ? LEFT_X + (10 - n) * P : RIGHT_X + (n - 1) * P);
const rowY = (r) => TOP + (r - 1) * ROW_P;

function Strip({ side, color, nums, taken, mine }) {
  const order = Array.from({ length: 10 }, (_, i) => (side === 'L' ? 10 - i : i + 1));
  const set = new Set(nums);
  const ends = side === 'L' ? ['Tường', 'Lối đi'] : ['Lối đi', 'Tường'];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
        <span>{ends[0]}</span>
        <span className="text-[12px] normal-case tracking-normal text-[#0F172A]">Bên {side === 'L' ? 'trái' : 'phải'}</span>
        <span>{ends[1]}</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {order.map((n) => {
          const isMine = mine === n;
          const own = set.has(n);
          return (
            <span
              key={n}
              className="flex h-9 items-center justify-center rounded-md text-[13px] font-bold tabular-nums"
              style={{
                background: isMine ? MY_SEAT_COLOR : own ? color : '#EEF2F6',
                color: isMine || own ? '#fff' : '#94A3B8',
                opacity: taken.has(n) && !isMine ? 0.3 : 1,
                boxShadow: isMine ? `0 0 0 2px #fff, 0 0 0 4px ${MY_SEAT_COLOR}` : undefined,
              }}
            >
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function HallMapMobile({ seatGroups = {}, highlightGroupId = null, color = '#008BC5', occupiedSeats = null, mySeatId = '' }) {
  const me = mySeatId ? parseSeatId(mySeatId) : null;

  const mine = useMemo(() => {
    const m = {};
    Object.entries(seatGroups).forEach(([id, g]) => {
      if (g !== highlightGroupId) return;
      const [r, side, n] = id.split('-');
      (m[+r] ||= { L: [], R: [] })[side]?.push(+n);
    });
    return m;
  }, [seatGroups, highlightGroupId]);

  const myRows = useMemo(() => Object.keys(mine).map(Number).sort((a, b) => a - b), [mine]);
  const defaultRow = me?.row ?? (myRows.length ? myRows[myRows.length - 1] : null); // hàng gần cửa nhất
  const [picked, setPicked] = useState(null);
  useEffect(() => setPicked(null), [highlightGroupId]);
  const sel = picked ?? defaultRow;
  const isTappable = (r) => !!mine[r] || me?.row === r;

  const farthest = myRows.length && !me ? myRows[0] : null;
  const taken = (r, side) =>
    new Set(Array.from({ length: 10 }, (_, i) => i + 1).filter((n) => occupiedSeats?.has(seatId(r, side, n)) && seatId(r, side, n) !== mySeatId));

  const rows = Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1);
  const pillW = 84;
  const pillX = me ? Math.min(Math.max(seatX(me.side, me.n) + SEAT_W / 2 - pillW / 2, LEFT_X), W - PAD - pillW) : 0;
  const pillBelow = me?.row === 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)]">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="group" aria-label="Sơ đồ hội trường">
        <rect x="0" y="0" width={W} height={H} fill="#FAFBFC" />
        <rect x={LEFT_X} y="8" width={W - PAD - LEFT_X} height="30" rx="10" fill="#0F172A" />
        <text x={(LEFT_X + W - PAD) / 2} y="24" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" letterSpacing="2.5" fill="#fff">SÂN KHẤU</text>
        <text x={LEFT_X + 5 * P} y="54" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#94A3B8">Bên trái</text>
        <text x={RIGHT_X + 5 * P} y="54" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#94A3B8">Bên phải</text>

        {farthest && (
          <path d={`M ${AISLE_X} ${ENT_Y - 4} V ${rowY(farthest) + SEAT_H / 2}`} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7" className="animated-hall-path" fill="none" />
        )}

        {rows.map((r) => {
          const y = rowY(r);
          const cy = y + SEAT_H / 2;
          const row = mine[r];
          const tappable = isTappable(r);
          const on = !!row || me?.row === r;
          return (
            <g key={r} onClick={tappable ? () => setPicked(r) : undefined} onKeyDown={tappable ? (e) => (e.key === 'Enter' || e.key === ' ') && setPicked(r) : undefined} role={tappable ? 'button' : undefined} tabIndex={tappable ? 0 : undefined} aria-label={tappable ? `Xem chi tiết hàng ${r}` : undefined} style={tappable ? { cursor: 'pointer' } : undefined}>
              {on && <rect x={PAD} y={y - 5} width={W - PAD * 2} height={SEAT_H + 10} rx="9" fill={color} fillOpacity="0.09" stroke={sel === r ? color : 'none'} strokeWidth="1.5" />}
              {on ? <rect x={PAD + 2} y={cy - 9} width="24" height="18" rx="9" fill={color} /> : null}
              <text x={PAD + 14} y={cy + 0.5} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight={on ? 800 : 600} fill={on ? '#fff' : isVipRow(r) ? '#B45309' : '#64748B'} style={{ fontVariantNumeric: 'tabular-nums' }}>{r}</text>
              {['L', 'R'].map((side) =>
                Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const own = row?.[side]?.includes(n);
                  const isMe = me && me.row === r && me.side === side && me.n === n;
                  const gone = own && !isMe && occupiedSeats?.has(seatId(r, side, n));
                  return <rect key={side + n} x={seatX(side, n)} y={y} width={SEAT_W} height={SEAT_H} rx="3.5" fill={isMe ? MY_SEAT_COLOR : own ? color : '#E6EBF1'} opacity={gone ? 0.28 : 1} style={{ transition: 'opacity .6s' }} />;
                })
              )}
              {row?.L.length > 0 && !me && <polygon points={`${AISLE_X - 5},${cy - 4.5} ${AISLE_X - 11},${cy} ${AISLE_X - 5},${cy + 4.5}`} fill={color} className="arrow-nudge-l" />}
              {row?.R.length > 0 && !me && <polygon points={`${AISLE_X + 5},${cy - 4.5} ${AISLE_X + 11},${cy} ${AISLE_X + 5},${cy + 4.5}`} fill={color} className="arrow-nudge-r" />}
            </g>
          );
        })}

        {me && (
          <g pointerEvents="none">
            <rect x={seatX(me.side, me.n) - 2.5} y={rowY(me.row) - 2.5} width={SEAT_W + 5} height={SEAT_H + 5} rx="6" fill="none" stroke={MY_SEAT_COLOR} strokeWidth="2" className="hall-halo-pulse" />
            <rect x={pillX} y={pillBelow ? rowY(1) + SEAT_H + 6 : rowY(me.row) - 23} width={pillW} height="16" rx="8" fill={MY_SEAT_COLOR} />
            <text x={pillX + pillW / 2} y={(pillBelow ? rowY(1) + SEAT_H + 6 : rowY(me.row) - 23) + 8.5} textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="700" fill="#fff">Bạn ngồi đây</text>
          </g>
        )}

        <rect x={AISLE_X - 52} y={ENT_Y} width="104" height="30" rx="10" fill="#334155" />
        <text x={AISLE_X} y={ENT_Y + 15.5} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" letterSpacing="1" fill="#fff">CỬA VÀO ↑</text>
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#EEF2F6] px-3.5 py-2.5 text-[12px] font-medium text-[#475569]">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />Ghế của nhóm</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-[#E6EBF1]" />Ghế khác</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] opacity-30" style={{ background: color }} />Đã có người</span>
        <span className="flex items-center gap-1.5"><b className="text-[#B45309]">1 2</b>Hàng VIP</span>
      </div>

      {sel && (
        <div key={sel} className="fade-in-up space-y-3 border-t border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-bold text-[#0F172A]">Hàng {sel}</span>
              {isVipRow(sel) && <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309]">VIP</span>}
            </div>
            {myRows.length > 1 && (
              <div className="flex gap-1.5" role="tablist" aria-label="Chọn hàng">
                {myRows.map((r) => (
                  <button key={r} type="button" role="tab" aria-selected={r === sel} onClick={() => setPicked(r)} className="h-8 min-w-8 rounded-full px-2.5 text-[13px] font-bold tabular-nums transition-colors" style={r === sel ? { background: color, color: '#fff' } : { background: '#fff', color: '#334155', boxShadow: 'inset 0 0 0 1px #CBD5E1' }}>{r}</button>
                ))}
              </div>
            )}
          </div>
          {['L', 'R'].map((side) => {
            const nums = mine[sel]?.[side] || [];
            if (!nums.length && me?.row !== sel) return null;
            return <Strip key={side} side={side} color={color} nums={nums} taken={taken(sel, side)} mine={me?.row === sel && me.side === side ? me.n : null} />;
          })}
        </div>
      )}
    </div>
  );
}
