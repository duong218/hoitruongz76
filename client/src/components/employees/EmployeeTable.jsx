import React, { useState, useMemo } from 'react';
import { Search, Edit2, Trash2, UserPlus, FileSpreadsheet } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ROLE_LABELS, ROLES } from '../../constants/roles.js';

export function EmployeeTable({
  employees = [],
  blocks = [],
  departments = [],
  onEdit,
  onDelete,
  onAddNew,
  onOpenImport,
  currentStaffCode = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');

  const blockMap = useMemo(() => {
    const map = new Map();
    blocks.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [blocks]);

  const deptMap = useMemo(() => {
    const map = new Map();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBlock =
        selectedBlockId === 'ALL' ||
        (selectedBlockId === 'UNASSIGNED' && !emp.blockId) ||
        emp.blockId === selectedBlockId;

      const matchDept =
        selectedDeptId === 'ALL' ||
        (selectedDeptId === 'UNASSIGNED' && !emp.departmentId) ||
        emp.departmentId === selectedDeptId;

      return matchSearch && matchBlock && matchDept;
    });
  }, [employees, searchTerm, selectedBlockId, selectedDeptId]);

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã NV hoặc họ tên..."
              aria-label="Tìm kiếm nhân viên"
              className="w-full min-h-[48px] pl-11 pr-4 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
            />
          </div>

          {/* Nút tác vụ */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={onOpenImport}
              icon={FileSpreadsheet}
            >
              Nhập từ Excel
            </Button>
            <Button
              variant="primary"
              onClick={onAddNew}
              icon={UserPlus}
            >
              Thêm người
            </Button>
          </div>
        </div>

        {/* Lọc theo Khối và Phòng ban sử dụng Select dùng chung */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Lọc theo Khối:"
            id="filter-block"
            value={selectedBlockId}
            onChange={(e) => setSelectedBlockId(e.target.value)}
          >
            <option value="ALL">Tất cả các Khối</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            <option value="UNASSIGNED">Chưa thuộc Khối nào</option>
          </Select>

          <Select
            label="Lọc theo Phòng ban:"
            id="filter-dept"
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
          >
            <option value="ALL">Tất cả Phòng ban / Phân xưởng</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
            <option value="UNASSIGNED">Chưa thuộc Phòng ban</option>
          </Select>
        </div>
      </div>

      {/* Hiển thị số lượng kết quả */}
      <div className="flex items-center justify-between text-[14px] text-[#64748B]">
        <span>Hiển thị <strong>{filteredEmployees.length}</strong> / {employees.length} người</span>
      </div>

      {filteredEmployees.length === 0 ? (
        <EmptyState
          title="Không tìm thấy nhân viên"
          description={
            searchTerm
              ? `Không có kết quả nào khớp với từ khóa "${searchTerm}".`
              : 'Chưa có nhân viên nào trong danh sách lọc.'
          }
        />
      ) : (
        <>
          {/* Bảng Desktop (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-3.5 px-4 text-[14px] font-bold text-[#475569] uppercase tracking-wider">
                    Mã NV
                  </th>
                  <th className="py-3.5 px-4 text-[14px] font-bold text-[#475569] uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="py-3.5 px-4 text-[14px] font-bold text-[#475569] uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="py-3.5 px-4 text-[14px] font-bold text-[#475569] uppercase tracking-wider">
                    Khối
                  </th>
                  <th className="py-3.5 px-4 text-[14px] font-bold text-[#475569] uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="py-3.5 px-4 text-[14px] font-bold text-[#475569] uppercase tracking-wider text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, index) => {
                  const blockName = emp.blockId ? blockMap.get(emp.blockId) : null;
                  const deptName = emp.departmentId ? deptMap.get(emp.departmentId) : null;
                  const isZebra = index % 2 === 1;

                  return (
                    <tr
                      key={emp.code}
                      className={`border-b border-[#E2E8F0] hover:bg-[#EAF6FF]/50 transition-colors ${
                        isZebra ? 'bg-[#F6F8FA]' : 'bg-[#FFFFFF]'
                      }`}
                    >
                      <td className="py-3 px-4 text-[16px] font-bold text-[#0F172A] font-mono">
                        {emp.code}
                      </td>
                      <td className="py-3 px-4 text-[16px] font-medium text-[#0F172A]">
                        {emp.name}
                      </td>
                      <td className="py-3 px-4 text-[15px] text-[#334155]">
                        {deptName || <span className="text-[#94A3B8] italic">—</span>}
                      </td>
                      <td className="py-3 px-4 text-[15px]">
                        {blockName ? (
                          <span className="font-semibold text-[#0F172A]">{blockName}</span>
                        ) : (
                          <span className="text-[#E53E3E] text-[13px] font-medium">Chưa có khối</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(emp)}
                            aria-label={`Sửa thông tin ${emp.name}`}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#008BC5] hover:bg-[#EAF6FF] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          {emp.code?.toUpperCase() === currentStaffCode?.toUpperCase() ? (
                            <span
                              className="text-[12px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1.5 rounded border border-[#E2E8F0] select-none"
                              title="Không thể xóa tài khoản đang đăng nhập"
                            >
                              Đang đăng nhập
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDelete(emp)}
                              aria-label={`Xóa nhân viên ${emp.name}`}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thẻ Mobile (< 640px) */}
          <div className="sm:hidden space-y-3">
            {filteredEmployees.map((emp) => {
              const blockName = emp.blockId ? blockMap.get(emp.blockId) : null;
              const deptName = emp.departmentId ? deptMap.get(emp.departmentId) : null;

              return (
                <div
                  key={emp.code}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[14px] font-bold text-[#008BC5] font-mono">
                        {emp.code}
                      </span>
                      <h4 className="text-[18px] font-bold text-[#0F172A] leading-tight">
                        {emp.name}
                      </h4>
                    </div>
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
                  </div>

                  <div className="text-[14px] text-[#334155] space-y-1 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                    <div>Phòng ban: <strong>{deptName || '—'}</strong></div>
                    <div>Khối: <strong>{blockName || 'Chưa có khối'}</strong></div>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => onEdit(emp)}
                      aria-label={`Sửa ${emp.name}`}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#008BC5] hover:bg-[#EAF6FF] rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {emp.code?.toUpperCase() === currentStaffCode?.toUpperCase() ? (
                      <span
                        className="text-[12px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1.5 rounded border border-[#E2E8F0] select-none"
                        title="Không thể xóa tài khoản đang đăng nhập"
                      >
                        Đang đăng nhập
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDelete(emp)}
                        aria-label={`Xóa ${emp.name}`}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
