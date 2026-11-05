import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useAttendance } from '../../hooks/useAttendance.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { seatBadgeText } from '../../utils/seatLabel.js';
import { GroupBadge } from '../../components/ui/GroupBadge.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  RotateCcw,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Building2,
  GitFork,
} from 'lucide-react';

export function AttendancePage() {
  const { attendance, resetAttendance, refresh } = useAttendance();
  const { employees } = useEmployees();
  const { groups } = useGroups();
  const { blocks, departments } = useOrg();
  const { event } = useEventSettings();
  const toast = useToast();
  const { confirm } = useConfirm();

  // Chế độ xem bảng tổng hợp: "BLOCK" hoặc "DEPT"
  const [summaryMode, setSummaryMode] = useState('BLOCK');

  // Bộ lọc bảng chi tiết
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlockId, setFilterBlockId] = useState('ALL');
  const [filterDeptId, setFilterDeptId] = useState('ALL');
  const [filterGroupId, setFilterGroupId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const blockMap = useMemo(() => new Map(blocks.map((b) => [b.id, b.name])), [blocks]);
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  // Phân loại nhân viên
  const { requiredEmployees, unassignedCount, attendanceMap } = useMemo(() => {
    const attMap = new Map();
    attendance.forEach((a) => {
      attMap.set(a.employeeCode.toUpperCase(), a);
    });

    let unassigned = 0;
    const required = [];

    employees.forEach((emp) => {
      const g = resolveGroup(emp, groups);
      if (!g) {
        unassigned++;
      } else if (g.checkInRequired) {
        required.push(emp);
      }
    });

    return {
      requiredEmployees: required,
      unassignedCount: unassigned,
      attendanceMap: attMap,
    };
  }, [employees, groups, attendance]);

  // Số liệu thẻ đầu trang
  const totalRequired = requiredEmployees.length;
  const totalChecked = useMemo(() => {
    return requiredEmployees.filter((e) => attendanceMap.has(e.code.toUpperCase())).length;
  }, [requiredEmployees, attendanceMap]);
  const totalUnchecked = totalRequired - totalChecked;
  const percentage = totalRequired > 0 ? Math.round((totalChecked / totalRequired) * 100) : 0;

  // Dữ liệu tổng hợp theo Khối hoặc Phòng ban
  const summaryList = useMemo(() => {
    if (summaryMode === 'BLOCK') {
      return blocks.map((b) => {
        const empsInBlock = requiredEmployees.filter((e) => e.blockId === b.id);
        const checked = empsInBlock.filter((e) => attendanceMap.has(e.code.toUpperCase())).length;
        const total = empsInBlock.length;
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        return { id: b.id, name: b.name, checked, total, pct };
      });
    } else {
      return departments.map((d) => {
        const empsInDept = requiredEmployees.filter((e) => e.departmentId === d.id);
        const checked = empsInDept.filter((e) => attendanceMap.has(e.code.toUpperCase())).length;
        const total = empsInDept.length;
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        return { id: d.id, name: d.name, checked, total, pct };
      });
    }
  }, [summaryMode, blocks, departments, requiredEmployees, attendanceMap]);

  // Danh sách chi tiết được lọc
  const filteredDetailList = useMemo(() => {
    return requiredEmployees.filter((emp) => {
      const isChecked = attendanceMap.has(emp.code.toUpperCase());
      const g = resolveGroup(emp, groups);

      const matchSearch =
        emp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBlock = filterBlockId === 'ALL' || emp.blockId === filterBlockId;
      const matchDept = filterDeptId === 'ALL' || emp.departmentId === filterDeptId;
      const matchGroup = filterGroupId === 'ALL' || (g && g.id === filterGroupId);
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'CHECKED' && isChecked) ||
        (filterStatus === 'UNCHECKED' && !isChecked);

      return matchSearch && matchBlock && matchDept && matchGroup && matchStatus;
    });
  }, [
    requiredEmployees,
    attendanceMap,
    groups,
    searchTerm,
    filterBlockId,
    filterDeptId,
    filterGroupId,
    filterStatus,
  ]);

  // Xuất file Excel
  const handleExportExcel = () => {
    const rows = [
      ['Mã NV', 'Họ và tên', 'Khối', 'Phòng ban', 'Nhóm ghế', 'Ghế ngồi', 'Giờ điểm danh', 'Trạng thái'],
    ];

    filteredDetailList.forEach((emp) => {
      const g = resolveGroup(emp, groups);
      const rec = attendanceMap.get(emp.code.toUpperCase());
      const blockName = emp.blockId ? blockMap.get(emp.blockId) || '' : '';
      const deptName = emp.departmentId ? deptMap.get(emp.departmentId) || '' : '';
      const groupName = g ? g.name : '';
      const seatText = rec ? seatBadgeText(rec.seatId) : '—';
      const timeText = rec
        ? new Date(rec.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '—';
      const statusText = rec ? 'Đã điểm danh' : 'Chưa điểm danh';

      rows.push([
        emp.code,
        emp.name,
        blockName,
        deptName,
        groupName,
        seatText,
        timeText,
        statusText,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
      { wch: 15 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diem_Danh');

    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cleanEventName = (event.eventName || 'Z176').replace(/\s+/g, '-');
    XLSX.writeFile(wb, `diem-danh-${cleanEventName}-${ymd}.xlsx`);
    toast.success('Đã xuất báo cáo điểm danh Excel thành công.');
  };

  // Đặt lại điểm danh
  const handleReset = async () => {
    const ok = await confirm({
      title: 'Đặt lại toàn bộ điểm danh',
      message: 'Hành động này sẽ xóa toàn bộ dữ liệu đã điểm danh của tất cả đại biểu và đưa trạng thái về ban đầu (0 người điểm danh).\n\nBạn có chắc chắn muốn thực hiện không?',
      confirmText: 'Xóa kết quả điểm danh',
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });

    if (ok) {
      await resetAttendance();
      toast.info('Đã đặt lại dữ liệu điểm danh về 0.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Tiêu đề & Nút tác vụ hàng đầu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
            Quản lý Điểm danh Hội trường
          </h1>
          <p className="text-[16px] text-[#64748B] mt-1">
            Theo dõi quân số đại biểu quét mã QR tại ghế ngồi theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh} icon={RefreshCw}>
            Làm mới
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} icon={Download}>
            Xuất Excel
          </Button>
          <Button variant="danger" onClick={handleReset} icon={RotateCcw}>
            Đặt lại điểm danh
          </Button>
        </div>
      </div>

      {/* 4 Thẻ số liệu Điểm danh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Cần điểm danh */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-2">
          <span className="text-[14px] font-semibold text-[#64748B]">Cần điểm danh</span>
          <p className="text-[32px] font-extrabold text-[#0F172A] leading-none">
            {totalRequired}
          </p>
          <span className="text-[13px] text-[#64748B] block">
            Nhân viên thuộc nhóm bắt buộc
          </span>
        </div>

        {/* Thẻ 2: Đã điểm danh */}
        <div className="bg-white border border-[#BBF7D0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] bg-gradient-to-r from-white to-[#ECFDF5]/30 space-y-2">
          <span className="text-[14px] font-semibold text-[#15803D]">Đã điểm danh</span>
          <p className="text-[32px] font-extrabold text-[#15803D] leading-none">
            {totalChecked}
          </p>
          <span className="text-[13px] text-[#15803D] font-medium block">
            Đã có mặt tại đúng ghế
          </span>
        </div>

        {/* Thẻ 3: Chưa điểm danh */}
        <div className="bg-white border border-[#FDE68A] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-2">
          <span className="text-[14px] font-semibold text-[#B45309]">Chưa điểm danh</span>
          <p className="text-[32px] font-extrabold text-[#B45309] leading-none">
            {totalUnchecked}
          </p>
          <span className="text-[13px] text-[#B45309] block">
            Chưa quét mã tại ghế
          </span>
        </div>

        {/* Thẻ 4: Tỷ lệ % */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#64748B]">Tỷ lệ hoàn thành</span>
            <span className="text-[18px] font-extrabold text-[#008BC5]">{percentage}%</span>
          </div>
          {/* Progress bar #008BC5 */}
          <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden">
            <div
              className="bg-[#008BC5] h-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[13px] text-[#64748B] block">
            {totalChecked} trên {totalRequired} nhân sự
          </span>
        </div>
      </div>

      {/* Dòng chú thích khi có nhân viên chưa thuộc nhóm nào */}
      {unassignedCount > 0 && (
        <div className="p-3 bg-[#FEF9EE] border border-[#FDE68A] rounded-xl text-[14px] text-[#B45309] flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Có <strong>{unassignedCount}</strong> nhân viên chưa được xếp vào nhóm nào (không tính vào danh sách điểm danh).
          </span>
        </div>
      )}

      {/* BẢNG TỔNG HỢP (THEO KHỐI / THEO PHÒNG BAN) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-bold text-[#0F172A]">
              Tổng hợp tỷ lệ có mặt
            </h3>
            <p className="text-[14px] text-[#64748B]">
              Theo dõi tiến độ điểm danh theo từng đơn vị trong doanh nghiệp.
            </p>
          </div>

          {/* 2 nút phân đoạn có chữ rõ ràng */}
          <div className="inline-flex p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg">
            <button
              type="button"
              onClick={() => setSummaryMode('BLOCK')}
              className={`px-4 py-2 rounded-md text-[14px] font-bold transition-colors cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                summaryMode === 'BLOCK'
                  ? 'bg-white text-[#008BC5] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>Theo Khối</span>
            </button>
            <button
              type="button"
              onClick={() => setSummaryMode('DEPT')}
              className={`px-4 py-2 rounded-md text-[14px] font-bold transition-colors cursor-pointer min-h-[40px] flex items-center gap-1.5 ${
                summaryMode === 'DEPT'
                  ? 'bg-white text-[#008BC5] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Theo Phòng ban</span>
            </button>
          </div>
        </div>

        {/* Lưới danh sách tiến độ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {summaryList.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold text-[#0F172A]">{item.name}</span>
                <span className="text-[14px] font-bold text-[#008BC5]">
                  {item.checked} / {item.total} ({item.pct}%)
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#008BC5] h-full transition-all duration-300"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BẢNG CHI TIẾT ĐIỂM DANH */}
      <div className="space-y-4">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Danh sách chi tiết</h3>
          <p className="text-[14px] text-[#64748B]">
            Chi tiết thời gian và vị trí ghế đã được quét mã của từng nhân viên.
          </p>
        </div>

        {/* Bộ lọc bảng chi tiết */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã NV hoặc họ tên..."
              className="w-full min-h-[48px] pl-11 pr-4 py-2 text-[16px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="filter-att-block" className="block text-[13px] font-semibold text-[#64748B] mb-1">
                Khối:
              </label>
              <select
                id="filter-att-block"
                value={filterBlockId}
                onChange={(e) => setFilterBlockId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-[15px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              >
                <option value="ALL">Tất cả các Khối</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-att-dept" className="block text-[13px] font-semibold text-[#64748B] mb-1">
                Phòng ban:
              </label>
              <select
                id="filter-att-dept"
                value={filterDeptId}
                onChange={(e) => setFilterDeptId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-[15px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              >
                <option value="ALL">Tất cả Phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-att-group" className="block text-[13px] font-semibold text-[#64748B] mb-1">
                Nhóm ghế:
              </label>
              <select
                id="filter-att-group"
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-[15px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              >
                <option value="ALL">Tất cả Nhóm ghế</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-att-status" className="block text-[13px] font-semibold text-[#64748B] mb-1">
                Trạng thái:
              </label>
              <select
                id="filter-att-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-[15px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CHECKED">Đã điểm danh</option>
                <option value="UNCHECKED">Chưa điểm danh</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bảng dạng Desktop */}
        <div className="hidden sm:block overflow-x-auto bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
          <table className="w-full text-left border-collapse text-[15px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Mã NV</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Họ và tên</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Khối</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Phòng ban</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Nhóm</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Vị trí ghế</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Giờ quét</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetailList.map((emp, index) => {
                const g = resolveGroup(emp, groups);
                const rec = attendanceMap.get(emp.code.toUpperCase());
                const isChecked = !!rec;
                const isZebra = index % 2 === 1;

                return (
                  <tr
                    key={emp.code}
                    className={`border-b border-[#E2E8F0] hover:bg-[#EAF6FF]/40 ${
                      isZebra ? 'bg-[#F6F8FA]' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold font-mono text-[#0F172A]">{emp.code}</td>
                    <td className="py-3 px-4 font-medium text-[#0F172A]">{emp.name}</td>
                    <td className="py-3 px-4 text-[#334155]">{emp.blockId ? blockMap.get(emp.blockId) : '—'}</td>
                    <td className="py-3 px-4 text-[#334155]">{emp.departmentId ? deptMap.get(emp.departmentId) : '—'}</td>
                    <td className="py-3 px-4">
                      {g ? <GroupBadge name={g.name} color={g.color} /> : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      {rec ? seatBadgeText(rec.seatId) : <span className="text-[#94A3B8] font-normal">—</span>}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {rec ? (
                        new Date(rec.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isChecked ? (
                        <Badge variant="success" icon={CheckCircle2}>
                          Đã điểm danh
                        </Badge>
                      ) : (
                        <Badge variant="warning" icon={Clock}>
                          Chưa điểm danh
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Danh sách thẻ trên Mobile */}
        <div className="sm:hidden space-y-3">
          {filteredDetailList.map((emp) => {
            const g = resolveGroup(emp, groups);
            const rec = attendanceMap.get(emp.code.toUpperCase());
            const isChecked = !!rec;

            return (
              <div
                key={emp.code}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[13px] font-mono font-bold text-[#008BC5]">{emp.code}</span>
                    <h4 className="text-[18px] font-bold text-[#0F172A] leading-tight">{emp.name}</h4>
                  </div>
                  {isChecked ? (
                    <Badge variant="success" icon={CheckCircle2}>Đã điểm danh</Badge>
                  ) : (
                    <Badge variant="warning" icon={Clock}>Chưa điểm danh</Badge>
                  )}
                </div>

                <div className="text-[14px] text-[#334155] space-y-1 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <div>Khối: <strong>{emp.blockId ? blockMap.get(emp.blockId) : '—'}</strong></div>
                  <div>Phòng: <strong>{emp.departmentId ? deptMap.get(emp.departmentId) : '—'}</strong></div>
                  <div>Nhóm: <strong>{g?.name || '—'}</strong></div>
                  {rec && (
                    <div className="text-[#15803D] font-bold pt-1 border-t border-[#E2E8F0]">
                      Ghế: {seatBadgeText(rec.seatId)} • Lúc: {new Date(rec.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
