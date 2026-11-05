import React from 'react';

/**
 * Ghế hội trường SVG (không in số ghế bên trong theo spec cập nhật Z176)
 * @param {{
 *   x: number,
 *   y: number,
 *   fill?: string,
 *   stroke?: string,
 * }} props
 */
export function Seat({
  x,
  y,
  fill = '#E2E8F0',
  stroke = '#CBD5E1',
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <use
        href="#hall-seat-symbol"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.2"
      />
    </g>
  );
}
