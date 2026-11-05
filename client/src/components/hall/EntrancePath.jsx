import React from 'react';

/**
 * Đường nét đứt dẫn đường từ cửa vào tới hàng ghế gần cửa nhất
 * @param {{ pathData: string[], color?: string }} props
 */
export function EntrancePath({ pathData = [], color = '#008BC5' }) {
  if (!pathData || pathData.length === 0) return null;

  return (
    <g className="entrance-path-layer" pointerEvents="none">
      {pathData.map((d, index) => (
        <path
          key={index}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray="8 6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animated-hall-path"
          markerEnd="url(#path-arrow-head)"
        />
      ))}
    </g>
  );
}
