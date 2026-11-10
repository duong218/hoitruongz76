import React from 'react';
import { getSeatCoords } from './geometry.js';

const GREEN = '#16A34A';

/**
 * Đánh dấu ghế người xem đã điểm danh: viền nhấp nháy quanh ghế + mũi tên + nhãn "Bạn đã ngồi đây".
 * Nhãn nằm ở khoảng trống phía trên hàng ghế (hàng 1 sát dãy số ghế nên đặt phía dưới).
 */
export function YouAreHere({ row, side, n }) {
  const c = getSeatCoords(row, side, n);
  const cx = c.x + c.width / 2;
  const below = row === 1;
  const pillW = 110;
  const pillH = 15;
  const pillX = Math.min(Math.max(cx - pillW / 2, 100), 840 - pillW);

  // Mũi tên 12px rộng, 9px cao, đầu nhọn chạm sát ghế
  const arrow = below
    ? `${cx - 6},${c.y + c.height + 11} ${cx + 6},${c.y + c.height + 11} ${cx},${c.y + c.height + 2}`
    : `${cx - 6},${c.y - 11} ${cx + 6},${c.y - 11} ${cx},${c.y - 2}`;
  const pillY = below ? c.y + c.height + 11 : c.y - 11 - pillH;

  return (
    <g className="you-are-here" pointerEvents="none" role="img" aria-label="Bạn đã ngồi đây">
      <rect
        x={c.x - 3}
        y={c.y - 3}
        width={c.width + 6}
        height={c.height + 6}
        rx="7"
        fill="none"
        stroke={GREEN}
        strokeWidth="3"
        className="hall-halo-pulse"
      />
      <polygon points={arrow} fill={GREEN} />
      <rect x={pillX} y={pillY} width={pillW} height={pillH} rx="7.5" fill={GREEN} stroke="#FFFFFF" strokeWidth="1.5" />
      <text
        x={pillX + pillW / 2}
        y={pillY + pillH / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="800"
        fill="#FFFFFF"
      >
        Bạn đã ngồi đây
      </text>
    </g>
  );
}
