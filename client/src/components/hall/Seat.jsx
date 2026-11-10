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
 *   dim?: boolean,
 * }} props
 */
export function Seat({
  x,
  y,
  seatNumber,
  fill = '#E2E8F0',
  stroke = '#CBD5E1',
  textColor,
  dim = false,
  onClick,
  title,
}) {
  // Tự động tính màu chữ tương phản:
  // Nếu ghế màu xám nhạt (#E2E8F0) -> Chữ màu xanh đen đậm nét (#334155)
  // Nếu ghế có màu nhóm -> Chữ màu trắng tinh (#FFFFFF)
  const isLight = fill === '#E2E8F0' || fill === 'transparent';
  const autoTextColor = textColor || (isLight ? '#334155' : '#FFFFFF');

  return (
    <g
      transform={`translate(${x}, ${y})`}
      opacity={dim ? 0.28 : 1}
      style={{ transition: 'opacity 0.6s ease', cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
    >
      {title && <title>{title}</title>}
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
          fontSize="10"
          fontWeight="900"
          className="select-none pointer-events-none"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {seatNumber}
        </text>
      )}
    </g>
  );
}
