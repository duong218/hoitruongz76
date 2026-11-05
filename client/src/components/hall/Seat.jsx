import React from 'react';

/**
 * Ghế hội trường SVG kèm số ghế nhỏ
 * @param {{
 *   x: number,
 *   y: number,
 *   seatNumber?: number,
 *   fill?: string,
 *   stroke?: string,
 *   textColor?: string,
 * }} props
 */
export function Seat({
  x,
  y,
  seatNumber,
  fill = '#E2E8F0',
  stroke = '#CBD5E1',
  textColor,
}) {
  // Tự động tính màu chữ tương phản nếu không truyền textColor:
  // Nếu ghế màu xám nhạt chưa gán (#E2E8F0) thì chữ màu xám đen #64748B
  // Nếu ghế có màu nhóm (nổi bật) thì chữ màu trắng #FFFFFF
  const isLight = fill === '#E2E8F0' || fill === 'transparent';
  const autoTextColor = textColor || (isLight ? '#64748B' : '#FFFFFF');

  return (
    <g transform={`translate(${x}, ${y})`}>
      <use
        href="#hall-seat-symbol"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
      {seatNumber !== undefined && (
        <text
          x="14"
          y="18.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill={autoTextColor}
          fontSize="9"
          fontWeight="800"
          className="select-none pointer-events-none"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {seatNumber}
        </text>
      )}
    </g>
  );
}
