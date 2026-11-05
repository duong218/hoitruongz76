import React, { useMemo } from 'react';
import { Plus, Edit2, Trash2, Users, Armchair, CheckCircle2, MinusCircle } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { GUEST_GROUP_ID } from '../../constants/roles.js';
import { resolveGroup } from '../../utils/resolveGroup.js';

export function GroupList({
  groups = [],
  employees = [],
  blocks = [],
  seatGroups = {},
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
}) {
  const blockMap = useMemo(() => {
    const map = new Map();
    blocks.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [blocks]);

  // Đếm số người (bằng resolveGroup) và số ghế của từng nhóm
  const stats = useMemo(() => {
    const empCounts = {};
    const seatCounts = {};

    employees.forEach((emp) => {
      const g = resolveGroup(emp, groups);
      if (g) {
        empCounts[g.id] = (empCounts[g.id] || 0) + 1;
      }
    });

    Object.values(seatGroups).forEach((gId) => {
      seatCounts[gId] = (seatCounts[gId] || 0) + 1;
    });

    return { empCounts, seatCounts };
  }, [employees, groups, seatGroups]);

  return (
    <div className="space-y-4">
      {/* Thanh tiêu đề và nút thêm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Danh sách các nhóm hội trường</h3>
          <p className="text-[14px] text-[#64748B]">
            Mỗi nhóm liên kết với một hoặc nhiều Khối. Người thuộc Khối nào sẽ tự động được xếp vào nhóm ghế đó.
          </p>
        </div>
        <Button variant="primary" onClick={onAddGroup} icon={Plus}>
          Thêm nhóm
        </Button>
      </div>

      {/* Lưới các nhóm */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const empCount = stats.empCounts[group.id] || 0;
          const seatCount = stats.seatCounts[group.id] || 0;
          const isSystem = group.isSystem || group.id === GUEST_GROUP_ID;
          const assignedBlockNames = (group.blockIds || [])
            .map((id) => blockMap.get(id))
            .filter(Boolean);

          return (
            <div
              key={group.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg shrink-0 border border-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                      style={{ backgroundColor: group.color }}
                    />
                    <h4 className="text-[18px] font-bold text-[#0F172A] truncate">
                      {group.name}
                    </h4>
                  </div>
                  {isSystem && (
                    <Badge variant="neutral">
                      Hệ thống
                    </Badge>
                  )}
                </div>

                {/* Khối thuộc nhóm */}
                {!isSystem ? (
                  <div className="space-y-1">
                    <span className="text-[13px] font-semibold text-[#64748B] block">
                      Khối liên kết:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedBlockNames.length > 0 ? (
                        assignedBlockNames.map((name, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[13px] font-semibold bg-[#F1F5F9] text-[#334155] rounded border border-[#E2E8F0]"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[13px] text-[#E53E3E] italic">
                          Chưa liên kết khối nào
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#64748B]">Dành cho khách mời tham dự ngoài danh sách</p>
                )}

                {/* Yêu cầu điểm danh */}
                <div>
                  {group.checkInRequired ? (
                    <Badge variant="info" icon={CheckCircle2}>
                      Yêu cầu điểm danh
                    </Badge>
                  ) : (
                    <Badge variant="neutral" icon={MinusCircle}>
                      Miễn điểm danh
                    </Badge>
                  )}
                </div>

                {/* Thống kê: N người - M ghế (N tính bằng resolveGroup) */}
                <div className="flex items-center justify-between text-[15px] text-[#334155] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#64748B]" />
                    <span><strong>{empCount}</strong> người</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Armchair className="w-4 h-4 text-[#64748B]" />
                    <span><strong>{seatCount}</strong> ghế</span>
                  </div>
                </div>
              </div>

              {/* Nút tác vụ */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => onEditGroup(group)}
                  aria-label={`Sửa nhóm ${group.name}`}
                  className="min-h-[44px] min-w-[44px] px-3 py-1.5 flex items-center justify-center gap-1.5 text-[15px] font-medium text-[#008BC5] hover:bg-[#EAF6FF] rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Sửa</span>
                </button>
                {!isSystem ? (
                  <button
                    type="button"
                    onClick={() => onDeleteGroup(group)}
                    aria-label={`Xóa nhóm ${group.name}`}
                    className="min-h-[44px] min-w-[44px] px-3 py-1.5 flex items-center justify-center gap-1.5 text-[15px] font-medium text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa</span>
                  </button>
                ) : (
                  <span className="text-[13px] text-[#94A3B8] italic px-2">
                    Cố định
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
