import React, { useMemo } from 'react';
import { CountUp } from '../../components/ui/CountUp.jsx';
import { Link } from 'react-router-dom';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { TOTAL_SEATS } from '../../constants/hall.js';
import { Badge } from '../../components/ui/Badge.jsx';
import {
  Users,
  GitFork,
  Building2,
  ShieldCheck,
  ArrowRight,
  Database,
  Armchair,
  Layers,
  UserCheck,
  Activity,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { employees, loading: empLoading } = useEmployees();
  const { blocks, departments, loading: orgLoading } = useOrg();
  const { groups } = useGroups();
  const { seatGroups } = useSeatAssignments();
  const { attendance } = useAttendance();

  // Đếm tài khoản quản trị & quản lý
  const adminCount = employees.filter((e) => e.role === ROLES.ADMIN).length;
  const managerCount = employees.filter((e) => e.role === ROLES.MANAGER).length;
  const employeeCount = employees.filter((e) => e.role === ROLES.EMPLOYEE).length;
  const unassignedOrgCount = employees.filter((e) => !e.blockId || !e.departmentId).length;

  // Thống kê sắp ghế & điểm danh
  const assignedSeats = Object.keys(seatGroups).length;
  const checkedInCount = attendance.length;

  // Bản đồ Khối và Phòng ban
  const blockMap = useMemo(() => new Map(blocks.map((b) => [b.id, b.name])), [blocks]);
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  // Phân bố nhân sự theo từng Khối
  const blockDistribution = useMemo(() => {
    return blocks.map((b) => {
      const count = employees.filter((e) => e.blockId === b.id).length;
      const pct = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
      return { id: b.id, name: b.name, count, pct };
    });
  }, [blocks, employees]);

  // Danh sách nhân sự mới nhất (Top 5)
  const recentEmployees = useMemo(() => {
    return [...employees].slice(-5).reverse();
  }, [employees]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-8">
      {/* 1. Header Banner hiện đại */}
      <div className="bg-gradient-to-r from-[#008BC5] via-[#0284C7] to-[#0369A1] rounded-2xl p-6 sm:p-8 text-white shadow-[0_4px_20px_rgba(0,139,197,0.25)] relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[13px] font-semibold text-white/95">
            <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            <span>Hệ thống Hội trường Z176 đang hoạt động</span>
          </div>
          <h1 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight leading-tight">
            Trung tâm Quản trị Hệ thống
          </h1>
          <p className="text-[15px] sm:text-[16px] text-white/90 leading-relaxed">
            Giám sát toàn diện dữ liệu nhân sự, mô hình cơ cấu tổ chức, sơ đồ 200 ghế hội trường và an toàn vận hành.
          </p>
        </div>

        {/* Nút hành động nhanh trên banner */}
        <div className="mt-5 flex flex-wrap gap-3 relative z-10">
          <Link
            to="/admin/employees"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#008BC5] hover:bg-white/90 rounded-xl font-bold text-[14px] shadow-sm transition-all active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Quản lý nhân sự</span>
          </Link>
          <Link
            to="/admin/org"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-[14px] backdrop-blur-md transition-all active:scale-95"
          >
            <GitFork className="w-4 h-4" />
            <span>Cơ cấu tổ chức</span>
          </Link>
          <Link
            to="/admin/maintenance"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-[14px] backdrop-blur-md transition-all active:scale-95"
          >
            <Database className="w-4 h-4" />
            <span>Sao lưu dữ liệu</span>
          </Link>
        </div>

        {/* Trang trí nền mờ chìm */}
        <div className="absolute right-[-40px] top-[-40px] w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-12 bottom-[-60px] w-60 h-60 rounded-full bg-[#38BDF8]/20 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Lưới 4 Thẻ chỉ số chính (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng nhân sự */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#64748B]">Tổng nhân sự</span>
            <div className="w-11 h-11 rounded-xl bg-[#EAF6FF] text-[#008BC5] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-[32px] font-black text-[#0F172A] tracking-tight">
              {empLoading ? '...' : <CountUp value={employees.length} />}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[13px]">
              <span className="text-[#008BC5] font-semibold">{employeeCount} nhân viên</span>
              <span className="text-[#94A3B8]">•</span>
              <span className="text-[#64748B]">{adminCount + managerCount} quản lý</span>
            </div>
          </div>
        </div>

        {/* Thẻ 2: Khối cơ quan */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#64748B]">Khối cơ quan</span>
            <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-[32px] font-black text-[#0F172A] tracking-tight">
              {orgLoading ? '...' : <CountUp value={blocks.length} />}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[13px] text-[#16A34A] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đơn vị xếp chỗ chính</span>
            </div>
          </div>
        </div>

        {/* Thẻ 3: Phòng ban trực thuộc */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#64748B]">Phòng ban / Phân xưởng</span>
            <div className="w-11 h-11 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-[32px] font-black text-[#0F172A] tracking-tight">
              {orgLoading ? '...' : <CountUp value={departments.length} />}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[13px] text-[#9333EA] font-semibold">
              <span>Trực thuộc {blocks.length} khối</span>
            </div>
          </div>
        </div>

        {/* Thẻ 4: Tài khoản Quản trị & Vận hành */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#64748B]">Tài khoản Quản trị</span>
            <div className="w-11 h-11 rounded-xl bg-[#FEF9EE] text-[#D97706] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-[32px] font-black text-[#0F172A] tracking-tight">
              {empLoading ? '...' : <CountUp value={adminCount + managerCount} />}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[13px] text-[#D97706] font-semibold">
              <span>{adminCount} Admin • {managerCount} Quản lý</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Khối trung tâm: Phân bố Khối cơ quan & Trạng thái hội trường */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái 2/3: Phân bổ nhân sự theo Khối */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#008BC5]" />
                <span>Phân bố nhân sự theo Khối cơ quan</span>
              </h2>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Tỷ trọng số lượng nhân viên thực tế đang biên chế tại từng khối
              </p>
            </div>
            <Link
              to="/admin/org"
              className="text-[13px] font-bold text-[#008BC5] hover:underline flex items-center gap-1"
            >
              <span>Xem cơ cấu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {blockDistribution.length === 0 ? (
              <p className="text-[14px] text-[#94A3B8] text-center py-6">Chưa có dữ liệu Khối cơ quan.</p>
            ) : (
              blockDistribution.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-semibold text-[#1E293B]">{item.name}</span>
                    <span className="font-mono text-[#64748B]">
                      <strong className="text-[#0F172A]">{item.count}</strong> người ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F1F5F9] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#008BC5] h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {unassignedOrgCount > 0 && (
            <div className="p-3 bg-[#FEF9EE] border border-[#FDE68A] rounded-xl flex items-center gap-2 text-[13px] text-[#B45309]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Hiện có <strong>{unassignedOrgCount}</strong> nhân sự chưa được phân Khối hoặc Phòng ban đầy đủ.
              </span>
              <Link to="/admin/employees" className="underline font-bold ml-auto shrink-0">
                Cập nhật ngay
              </Link>
            </div>
          )}
        </div>

        {/* Cột phải 1/3: Trạng thái Vận hành Hội trường */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] flex flex-col justify-between space-y-5">
          <div>
            <div className="pb-3 border-b border-[#F1F5F9]">
              <h2 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                <Armchair className="w-5 h-5 text-[#008BC5]" />
                <span>Tiến độ Sắp xếp Hội trường</span>
              </h2>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                Quy mô chuẩn 200 chỗ ngồi (Phân hệ Quản lý)
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {/* Vòng tiến độ ghế */}
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-semibold text-[#475569]">Số ghế đã gán nhóm:</span>
                  <span className="font-extrabold text-[#008BC5]">
                    {assignedSeats} / {TOTAL_SEATS} ghế
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#008BC5] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((assignedSeats / TOTAL_SEATS) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Tình hình điểm danh */}
              <div className="p-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] space-y-1">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-semibold text-[#16A34A] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    <span>Đại biểu đã điểm danh:</span>
                  </span>
                  <span className="font-extrabold text-[#15803D] text-[16px]">
                    {checkedInCount} người
                  </span>
                </div>
                <p className="text-[12px] text-[#16A34A]">
                  Đã ghi nhận quét mã QR thành công tại ghế
                </p>
              </div>

              {/* Số nhóm ghế */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-[14px]">
                <span className="text-[#64748B] font-medium flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#64748B]" />
                  <span>Số nhóm hội trường:</span>
                </span>
                <span className="font-bold text-[#0F172A]">{groups.length} nhóm</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B] text-center">
            Tính năng sắp ghế & điểm danh do tài khoản <strong>Quản lý (MANAGER)</strong> phụ trách vận hành.
          </div>
        </div>
      </div>

      {/* 4. Danh sách Nhân sự Mới cập nhật & Lối tắt nhanh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nhân sự mới nhất (2/3) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#008BC5]" />
                <span>Nhân sự mới cập nhật gần đây</span>
              </h2>
              <p className="text-[13px] text-[#64748B] mt-0.5">
                5 nhân sự mới nhất trong cơ sở dữ liệu
              </p>
            </div>
            <Link
              to="/admin/employees"
              className="text-[13px] font-bold text-[#008BC5] hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả ({employees.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                  <th className="py-2.5 px-3 font-semibold">Mã NV</th>
                  <th className="py-2.5 px-3 font-semibold">Họ và tên</th>
                  <th className="py-2.5 px-3 font-semibold">Phòng ban</th>
                  <th className="py-2.5 px-3 font-semibold">Khối</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Vai trò</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#94A3B8]">
                      Chưa có nhân sự nào trong danh sách.
                    </td>
                  </tr>
                ) : (
                  recentEmployees.map((emp) => (
                    <tr key={emp.code} className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">{emp.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{emp.name}</td>
                      <td className="py-2.5 px-3 text-[#475569]">
                        {emp.departmentId ? deptMap.get(emp.departmentId) || '—' : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[#475569]">
                        {emp.blockId ? blockMap.get(emp.blockId) || '—' : <span className="text-[#E53E3E] text-[12px]">Chưa có</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge
                          variant={
                            emp.role === ROLES.ADMIN
                              ? 'error'
                              : emp.role === ROLES.MANAGER
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {ROLE_LABELS[emp.role] || emp.role}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lối tắt quản trị hệ thống (1/3) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] space-y-4">
          <div className="pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-[18px] font-bold text-[#0F172A]">Công cụ Quản trị</h2>
            <p className="text-[13px] text-[#64748B] mt-0.5">Truy cập nhanh các phân hệ</p>
          </div>

          <div className="space-y-3">
            <Link
              to="/admin/employees"
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-[#008BC5] hover:bg-[#F8FAFC] transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EAF6FF] text-[#008BC5] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-[15px] text-[#0F172A] group-hover:text-[#008BC5] block truncate">
                  Danh sách Nhân sự
                </span>
                <span className="text-[12px] text-[#64748B]">Thêm, sửa, nhập file Excel</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#008BC5]" />
            </Link>

            <Link
              to="/admin/org"
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-[#008BC5] hover:bg-[#F8FAFC] transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shrink-0">
                <GitFork className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-[15px] text-[#0F172A] group-hover:text-[#008BC5] block truncate">
                  Cơ cấu Tổ chức
                </span>
                <span className="text-[12px] text-[#64748B]">Quản lý Khối & Phòng ban</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#008BC5]" />
            </Link>

            <Link
              to="/admin/maintenance"
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-[#E53E3E] hover:bg-[#FEECEC]/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#FEECEC] text-[#E53E3E] flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-[15px] text-[#0F172A] group-hover:text-[#E53E3E] block truncate">
                  Bảo trì & Sao lưu
                </span>
                <span className="text-[12px] text-[#64748B]">Xuất & khôi phục JSON</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#E53E3E]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}