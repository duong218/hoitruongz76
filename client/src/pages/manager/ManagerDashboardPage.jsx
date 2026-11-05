import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { TOTAL_SEATS } from '../../constants/hall.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { HallLegend } from '../../components/hall/HallLegend.jsx';
import { Armchair, Layers, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export function ManagerDashboardPage() {
  const { groups } = useGroups();
  const { seatGroups } = useSeatAssignments();
  const { event } = useEventSettings();
  const { employees } = useEmployees();
  const { attendance } = useAttendance();

  const assignedSeatCount = Object.keys(seatGroups).length;

  // Tính số người Cần điểm danh và Đã điểm danh
  const { requiredCount, checkedInCount } = useMemo(() => {
    // Những nhân viên thuộc nhóm có checkInRequired === true
    const requiredEmps = employees.filter((emp) => {
      const g = resolveGroup(emp, groups);
      return g && g.checkInRequired;
    });

    const checkedInCodes = new Set(attendance.map((a) => a.employeeCode.toUpperCase()));
    const checked = requiredEmps.filter((emp) =>
      checkedInCodes.has(emp.code.toUpperCase())
    ).length;

    return {
      requiredCount: requiredEmps.length,
      checkedInCount: checked,
    };
  }, [employees, groups, attendance]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Tổng quan Vận hành Hội trường
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Theo dõi tiến độ sắp xếp 200 ghế ngồi, số lượng các nhóm và tình hình điểm danh của đại biểu.
        </p>
      </div>

      {/* 4 Thẻ số liệu quản lý */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Ghế đã gán / 200 */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Ghế đã sắp</span>
            <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
              {assignedSeatCount} / {TOTAL_SEATS}
            </p>
            <span className="text-[13px] text-[#22C55E] font-medium block">
              Còn trống {TOTAL_SEATS - assignedSeatCount} ghế
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#22C55E] flex items-center justify-center shrink-0">
            <Armchair className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 2: Số nhóm */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Số nhóm ghế</span>
            <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
              {groups.length}
            </p>
            <span className="text-[13px] text-[#64748B] font-medium block">
              Bao gồm Khách mời
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 3: Khách mời */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Khách mời</span>
            <p className="text-[22px] font-extrabold leading-tight">
              {event.guestEnabled ? (
                <span className="text-[#15803D]">Đang bật</span>
              ) : (
                <span className="text-[#64748B]">Đang tắt</span>
              )}
            </p>
            <span className="text-[13px] text-[#64748B] block">
              {event.guestEnabled ? 'Cho phép nhập tên' : 'Chỉ nhận mã nhân viên'}
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              event.guestEnabled ? 'bg-[#ECFDF5] text-[#22C55E]' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
          >
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 4: Điểm danh Đã/Cần + Nút Xem điểm danh */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#64748B]">Điểm danh</span>
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded ${event.checkInOpen ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#FEECEC] text-[#B91C1C]'}`}>
              {event.checkInOpen ? 'Đang mở' : 'Đang đóng'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-extrabold text-[#008BC5] leading-none">
              {checkedInCount}
            </span>
            <span className="text-[18px] font-bold text-[#64748B]">
              / {requiredCount} người
            </span>
          </div>
          <Link
            to="/manager/attendance"
            className="text-[14px] font-bold text-[#008BC5] hover:text-[#0072A3] flex items-center gap-1 pt-1"
          >
            <span>Xem điểm danh</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Sơ đồ hội trường 2D chế độ MANAGE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-bold text-[#0F172A]">
              Sơ đồ hiện trạng phân bổ chỗ ngồi hội trường
            </h2>
            <p className="text-[14px] text-[#64748B]">
              Xem tổng quan bố trí vị trí các khối trên sơ đồ 2D.
            </p>
          </div>
          <Link
            to="/manager/seating"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#008BC5] hover:text-[#0072A3] min-h-[44px] cursor-pointer"
          >
            <span>Vào chỉnh sửa sắp chỗ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <HallMap
          mode="manage"
          seatGroups={seatGroups}
          groups={groups}
        />

        <HallLegend
          groups={groups}
          seatGroups={seatGroups}
        />
      </div>
    </div>
  );
}
