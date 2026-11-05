import React from 'react';
import { Link } from 'react-router-dom';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useOrg } from '../../hooks/useOrg.js';
import { ROLES } from '../../constants/roles.js';
import { Users, GitFork, Building2, ShieldCheck, ArrowRight, Database } from 'lucide-react';

export function AdminDashboardPage() {
  const { employees, loading: empLoading } = useEmployees();
  const { blocks, departments, loading: orgLoading } = useOrg();

  // Đếm số tài khoản quản trị & quản lý
  const managerAccountCount = employees.filter(
    (e) => e.role === ROLES.ADMIN || e.role === ROLES.MANAGER
  ).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Tổng quan Quản trị Hệ thống
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Theo dõi tổng thể dữ liệu nhân sự, cơ cấu tổ chức và an toàn dữ liệu hội trường Z176.
        </p>
      </div>

      {/* 4 thẻ số liệu của Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng số người */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Tổng nhân sự</span>
            <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
              {empLoading ? '—' : employees.length}
            </p>
            <span className="text-[13px] text-[#008BC5] font-medium block">
              Đã lập danh sách
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] text-[#008BC5] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 2: Số Khối */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Số Khối cơ quan</span>
            <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
              {orgLoading ? '—' : blocks.length}
            </p>
            <span className="text-[13px] text-[#64748B] font-medium block">
              Đơn vị xếp chỗ chính
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] flex items-center justify-center shrink-0">
            <GitFork className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 3: Số Phòng ban */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Số Phòng ban</span>
            <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
              {orgLoading ? '—' : departments.length}
            </p>
            <span className="text-[13px] text-[#15803D] font-medium block">
              Trực thuộc các Khối
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#22C55E] flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 4: Tài khoản Quản lý */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-[#64748B]">Tài khoản Quản lý</span>
            <p className="text-[28px] font-extrabold text-[#0F172A] leading-none">
              {empLoading ? '—' : managerAccountCount}
            </p>
            <span className="text-[13px] text-[#B45309] font-medium block">
              Admin & Quản lý
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FEF9EE] text-[#F6AD37] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Các lối tắt quản trị */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Link
          to="/admin/employees"
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] hover:border-[#008BC5] transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#EAF6FF] text-[#008BC5] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-[#0F172A] group-hover:text-[#008BC5]">
              Quản lý Nhân sự
            </h3>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              Thêm, sửa, xóa danh sách nhân viên, gán Phòng ban - Khối và nhập nhanh từ bảng tính Excel.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[#008BC5] pt-2">
            <span>Truy cập danh sách</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/org"
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] hover:border-[#008BC5] transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0] flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-[#0F172A] group-hover:text-[#008BC5]">
              Cơ cấu Tổ chức
            </h3>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              Thiết lập danh mục các Khối cơ quan và các Phòng ban / Phân xưởng theo đúng biên chế.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[#008BC5] pt-2">
            <span>Quản lý Khối & Phòng ban</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          to="/admin/maintenance"
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] hover:border-[#008BC5] transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#FEECEC] text-[#E53E3E] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-bold text-[#0F172A] group-hover:text-[#008BC5]">
              Bảo trì & Sao lưu
            </h3>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              Tải file sao lưu JSON toàn bộ hệ thống, khôi phục dữ liệu hoặc đặt lại dữ liệu thử nghiệm.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[#008BC5] pt-2">
            <span>Xem công cụ bảo trì</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
