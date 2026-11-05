import React from 'react';
import { GroupBadge } from '../ui/GroupBadge.jsx';

export function HallLegend({ groups = [], seatGroups = {}, className = '' }) {
  // Đếm số ghế của từng nhóm
  const seatCounts = {};
  Object.values(seatGroups).forEach((gId) => {
    seatCounts[gId] = (seatCounts[gId] || 0) + 1;
  });

  return (
    <div className={`bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ${className}`}>
      <h4 className="text-[14px] font-bold text-[#64748B] uppercase tracking-wider mb-3">
        Chú thích màu các nhóm trong hội trường
      </h4>
      <div className="flex flex-wrap gap-2.5 items-center">
        {groups.map((group) => {
          const count = seatCounts[group.id] || 0;
          return (
            <div key={group.id} className="flex items-center gap-1.5">
              <GroupBadge name={group.name} color={group.color} />
              <span className="text-[14px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                {count} ghế
              </span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <GroupBadge name="Chưa gán" color="#E2E8F0" />
        </div>
      </div>
    </div>
  );
}
