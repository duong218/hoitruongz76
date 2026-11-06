import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../hooks/useAttendance.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { findDuplicateSeats, recordNotes } from '../../utils/attendanceInsights.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { seatBadgeText } from '../../utils/seatLabel.js';
import { GroupBadge } from '../../components/ui/GroupBadge.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
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
  UserPlus,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const STATUS_LABEL = {
  CHECKED: 'Đã điểm danh',
  UNCHECKED: 'Chưa điểm danh',
  DUP: 'Trùng ghế',
  PROXY: 'Điểm danh hộ',
};

const TABS = [
  { id: 'BLOCK', label: 'Theo Khối', icon: GitFork },
  { id: 'DEPT', label: 'Theo Phòng ban', icon: Building2 },
  { id: 'DETAIL', label: 'Danh sách chi tiết', icon: FileText },
];

export function AttendancePage() {
  const { attendance, resetAttendance, refresh, manualCheckIn } = useAttendance();
  const { employees } = useEmployees();
  const { groups } = useGroups();
  const { blocks, departments } = useOrg();
  const { event } = useEventSettings();
  const toast = useToast();
  const { confirm } = useConfirm();
  const { user } = useAuth();

  // Modal "Điểm danh hộ"
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEmpCode, setManualEmpCode] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualSearchTerm, setManualSearchTerm] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Tab đang xem: 'BLOCK' (theo Khối) | 'DEPT' (theo Phòng ban) | 'DETAIL' (danh sách chi tiết)
  const [view, setView] = useState('BLOCK');
  const summaryMode = view === 'DEPT' ? 'DEPT' : 'BLOCK';

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

  // Ghế có từ 2 người khác nhau trở lên (chỉ tính trong dữ liệu sự kiện hiện tại)
  const dupSeats = useMemo(() => findDuplicateSeats(attendance), [attendance]);
  const proxyCount = useMemo(() => attendance.filter((a) => a.method === 'PROXY').length, [attendance]);

  // Số liệu thẻ đầu trang
  const totalRequired = requiredEmployees.length;
  const totalChecked = useMemo(() => {
    return requiredEmployees.filter((e) => attendanceMap.has(e.code.toUpperCase())).length;
  }, [requiredEmployees, attendanceMap]);
  const totalUnchecked = totalRequired - totalChecked;
  const percentage = totalRequired > 0 ? Math.round((totalChecked / totalRequired) * 100) : 0;

  // Danh sách NV chưa điểm danh (dùng trong modal Điểm danh hộ)
  const uncheckedEmployees = useMemo(() => {
    return requiredEmployees.filter((e) => !attendanceMap.has(e.code.toUpperCase()));
  }, [requiredEmployees, attendanceMap]);

  // Danh sách NV chưa điểm danh được lọc theo từ khóa tìm kiếm trong modal
  const filteredModalEmployees = useMemo(() => {
    if (!manualSearchTerm.trim()) return uncheckedEmployees;
    const q = manualSearchTerm.toLowerCase();
    return uncheckedEmployees.filter(
      (e) => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    );
  }, [uncheckedEmployees, manualSearchTerm]);

  // Mở modal Điểm danh hộ (có thể pre-fill mã NV)
  const openManualModal = (empCode = '') => {
    setManualEmpCode(empCode);
    setManualReason('');
    setManualSearchTerm('');
    setShowManualModal(true);
  };

  // Gửi điểm danh hộ
  const handleManualCheckIn = async () => {
    if (!manualEmpCode.trim()) {
      toast.error('Vui lòng chọn nhân viên cần điểm danh hộ.');
      return;
    }
    if (!manualReason.trim()) {
      toast.error('Vui lòng nhập lý do điểm danh hộ (bắt buộc ghi nhật ký).');
      return;
    }

    try {
      setManualLoading(true);
      await manualCheckIn({
        employeeCode: manualEmpCode.trim(),
        reason: manualReason.trim(),
      });
      const empName = employees.find(
        (e) => e.code.toUpperCase() === manualEmpCode.toUpperCase()
      )?.name || manualEmpCode;
      toast.success(`Đã điểm danh hộ cho ${empName} thành công.`);
      setShowManualModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể điểm danh hộ.');
    } finally {
      setManualLoading(false);
    }
  };

  // Lý do nhanh gợi ý
  const QUICK_REASONS = [
    'Quên điện thoại',
    'Camera hỏng',
    'Điện thoại hết pin',
    'Không quét được QR',
  ];

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
        (filterStatus === 'UNCHECKED' && !isChecked) ||
        (filterStatus === 'DUP' && !!attendanceMap.get(emp.code.toUpperCase())?.seatId && dupSeats.has(attendanceMap.get(emp.code.toUpperCase()).seatId)) ||
        (filterStatus === 'PROXY' && attendanceMap.get(emp.code.toUpperCase())?.method === 'PROXY');

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
    dupSeats,
  ]);

  // Các bộ lọc đang bật (hiển thị trong hộp thông báo trước khi xuất và ghi vào file Excel)
  const activeFilters = [
    searchTerm.trim() && `Từ khóa: "${searchTerm.trim()}"`,
    filterBlockId !== 'ALL' && `Khối: ${blockMap.get(filterBlockId) || ''}`,
    filterDeptId !== 'ALL' && `Phòng ban: ${deptMap.get(filterDeptId) || ''}`,
    filterGroupId !== 'ALL' && `Nhóm ghế: ${groups.find((g) => g.id === filterGroupId)?.name || ''}`,
    filterStatus !== 'ALL' && `Trạng thái: ${STATUS_LABEL[filterStatus]}`,
  ].filter(Boolean);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBlockId('ALL');
    setFilterDeptId('ALL');
    setFilterGroupId('ALL');
    setFilterStatus('ALL');
  };

  // Xuất file Excel theo đúng bộ lọc đang chọn (có viền, màu, ghi chú trùng ghế / điểm danh hộ)
  const handleExportExcel = async () => {
    if (filteredDetailList.length === 0) {
      toast.error('Không có nhân viên nào khớp bộ lọc hiện tại để xuất.');
      return;
    }
    const ok = await confirm({
      title: 'Xuất Excel theo bộ lọc',
      message: activeFilters.length
        ? `Sẽ xuất ${filteredDetailList.length} / ${totalRequired} nhân viên theo bộ lọc đang chọn:\n${activeFilters.map((f) => `• ${f}`).join('\n')}\n\nMuốn xuất toàn bộ thì bấm Hủy bỏ rồi chọn "Xóa bộ lọc".`
        : `Chưa chọn bộ lọc nào, sẽ xuất toàn bộ ${filteredDetailList.length} nhân viên.`,
      confirmText: `Xuất ${filteredDetailList.length} dòng`,
      cancelText: 'Hủy bỏ',
    });
    if (!ok) return;

    const rows = filteredDetailList.map((emp) => {
      const g = resolveGroup(emp, groups);
      const rec = attendanceMap.get(emp.code.toUpperCase());
      const { dupText, proxyText } = recordNotes(rec, dupSeats);
      return {
        code: emp.code,
        name: emp.name,
        block: emp.blockId ? blockMap.get(emp.blockId) || '' : '',
        dept: emp.departmentId ? deptMap.get(emp.departmentId) || '' : '',
        group: g ? g.name : '',
        seat: rec ? (rec.seatId ? seatBadgeText(rec.seatId) : 'Không có ghế') : '—',
        time: rec ? new Date(rec.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
        status: rec ? 'Đã điểm danh' : 'Chưa điểm danh',
        dupText,
        proxyText,
        proxyBy: rec?.checkedInBy || '',
        proxyReason: rec?.reason || '',
      };
    });

    try {
      const { exportAttendanceXlsx } = await import('../../utils/excelExport.js');
      await exportAttendanceXlsx({
        eventName: event.eventName,
        exportedBy: user?.name ? `${user.name} (${user.code})` : user?.code,
        filters: activeFilters,
        rows,
        summary: {
          required: totalRequired,
          checked: totalChecked,
          unchecked: totalUnchecked,
          dupSeats: dupSeats.size,
          proxy: proxyCount,
        },
      });
      toast.success('Đã xuất báo cáo điểm danh Excel thành công.');
    } catch (err) {
      toast.error(err.message || 'Không xuất được file Excel.');
    }
  };

  // Đặt lại điểm danh
  const handleReset = async () => {
    const ok = await confirm({
      title: 'Đặt lại toàn bộ điểm danh',
      message: 'Hãy xuất Excel trước nếu cần lưu. Hành động này sẽ xóa toàn bộ dữ liệu đã điểm danh của tất cả đại biểu và đưa trạng thái về ban đầu (0 người điểm danh).\n\nBạn có chắc chắn muốn thực hiện không?',
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
      {/* Tiêu đề, rồi một hàng nút: việc hay dùng bên trái, nút nguy hiểm tách riêng bên phải */}
      <div className="space-y-4">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
            Quản lý Điểm danh Hội trường
          </h1>
          <p className="text-[16px] text-[#64748B] mt-1">
            Theo dõi quân số đại biểu quét mã QR tại ghế ngồi theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" onClick={() => openManualModal()} icon={UserPlus}>
            Điểm danh hộ
          </Button>
          <Button variant="secondary" onClick={refresh} icon={RefreshCw}>
            Làm mới
          </Button>
          <Button variant="danger" onClick={handleReset} icon={RotateCcw} className="sm:ml-auto">
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

      {/* Cảnh báo trùng ghế luôn hiện ở mọi tab */}
      {dupSeats.size > 0 && (
        <div className="p-4 bg-[#FEE2E2] border-l-4 border-l-[#DC2626] border border-[#FCA5A5] rounded-r-xl flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-6 h-6 text-[#B91C1C] shrink-0" />
            <p className="text-[16px] font-semibold text-[#7F1D1D]">
              Có {dupSeats.size} ghế bị nhiều người cùng điểm danh. Các dòng này được tô đỏ kèm chữ "TRÙNG GHẾ".
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setFilterStatus('DUP');
              setView('DETAIL');
            }}
            className="px-4 min-h-[48px] text-[16px] font-bold text-[#B91C1C] bg-white border border-[#FCA5A5] rounded-[10px] cursor-pointer"
          >
            Chỉ xem các dòng trùng
          </button>
        </div>
      )}

      {/* 3 TAB: Theo Khối | Theo Phòng ban | Danh sách chi tiết */}
      <div role="tablist" className="grid grid-cols-3 gap-1 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`min-h-[52px] px-2 py-2 rounded-lg text-[16px] font-bold leading-5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center cursor-pointer transition-colors ${
              view === id ? 'bg-white text-[#008BC5] shadow-sm' : 'text-[#334155] hover:text-[#0F172A]'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* BẢNG TỔNG HỢP: Theo Khối hoặc Theo Phòng ban */}
      {view !== 'DETAIL' && (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-4">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">
            Tỷ lệ có mặt {view === 'DEPT' ? 'theo Phòng ban' : 'theo Khối'}
          </h3>
          <p className="text-[16px] text-[#334155]">
            Số người đã điểm danh trên tổng số người bắt buộc của từng {view === 'DEPT' ? 'phòng ban' : 'khối'}.
          </p>
        </div>

        {/* Lưới danh sách tiến độ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {summaryList.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[16px] font-bold text-[#0F172A]">{item.name}</span>
                <span className="text-[16px] font-bold text-[#008BC5] whitespace-nowrap">
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
      )}

      {/* BẢNG CHI TIẾT ĐIỂM DANH */}
      {view === 'DETAIL' && (
      <div className="space-y-4">
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A]">Danh sách chi tiết</h3>
          <p className="text-[16px] text-[#334155]">
            Chi tiết thời gian và vị trí ghế đã được quét mã của từng nhân viên. File Excel được xuất theo đúng bộ lọc bên dưới.
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
            <Select
              label="Khối:"
              id="filter-att-block"
              value={filterBlockId}
              onChange={(e) => setFilterBlockId(e.target.value)}
              size="sm"
            >
              <option value="ALL">Tất cả các Khối</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>

            <Select
              label="Phòng ban:"
              id="filter-att-dept"
              value={filterDeptId}
              onChange={(e) => setFilterDeptId(e.target.value)}
              size="sm"
            >
              <option value="ALL">Tất cả Phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Select
              label="Nhóm ghế:"
              id="filter-att-group"
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              size="sm"
            >
              <option value="ALL">Tất cả Nhóm ghế</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>

            <Select
              label="Trạng thái:"
              id="filter-att-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHECKED">Đã điểm danh</option>
              <option value="UNCHECKED">Chưa điểm danh</option>
              <option value="DUP">Trùng ghế</option>
              <option value="PROXY">Điểm danh hộ</option>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <p className="flex-1 text-[16px] text-[#0F172A]">
              Đang hiển thị <strong>{filteredDetailList.length}</strong> / {totalRequired} nhân viên
              {activeFilters.length > 0 && ' (đang lọc)'}
            </p>
            {activeFilters.length > 0 && (
              <Button variant="ghost" onClick={clearFilters} icon={X}>
                Xóa bộ lọc
              </Button>
            )}
            <Button variant="primary" onClick={handleExportExcel} icon={Download} disabled={filteredDetailList.length === 0}>
              Xuất Excel ({filteredDetailList.length})
            </Button>
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
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">Ghi chú</th>
                <th className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px] text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetailList.map((emp, index) => {
                const g = resolveGroup(emp, groups);
                const rec = attendanceMap.get(emp.code.toUpperCase());
                const isChecked = !!rec;
                const isZebra = index % 2 === 1;
                const { dupText, proxyText } = recordNotes(rec, dupSeats);
                const rowBg = dupText ? 'bg-[#FEE2E2]' : proxyText ? 'bg-[#FEF9C3]' : isZebra ? 'bg-[#F6F8FA]' : 'bg-white';

                return (
                  <tr
                    key={emp.code}
                    className={`border-b border-[#E2E8F0] hover:bg-[#EAF6FF]/40 ${rowBg}`}
                  >
                    <td className="py-3 px-4 font-bold font-mono text-[#0F172A]">{emp.code}</td>
                    <td className="py-3 px-4 font-medium text-[#0F172A]">{emp.name}</td>
                    <td className="py-3 px-4 text-[#334155]">{emp.blockId ? blockMap.get(emp.blockId) : '—'}</td>
                    <td className="py-3 px-4 text-[#334155]">{emp.departmentId ? deptMap.get(emp.departmentId) : '—'}</td>
                    <td className="py-3 px-4">
                      {g ? <GroupBadge name={g.name} color={g.color} /> : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      {rec ? (rec.seatId ? seatBadgeText(rec.seatId) : 'Không có ghế') : <span className="text-[#94A3B8] font-normal">—</span>}
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
                    <td className="py-3 px-4 text-[13px] font-semibold min-w-[220px]">
                      {dupText && <div className="text-[#B91C1C]">{dupText}</div>}
                      {proxyText && <div className="text-[#854D0E]">{proxyText}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isChecked && (
                        <button
                          type="button"
                          onClick={() => openManualModal(emp.code)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-semibold text-[#008BC5] bg-[#EAF6FF] hover:bg-[#D0EDFF] rounded-lg transition-colors cursor-pointer"
                          title={`Điểm danh hộ cho ${emp.name}`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Điểm danh hộ
                        </button>
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
            const { dupText, proxyText } = recordNotes(rec, dupSeats);

            return (
              <div
                key={emp.code}
                className={`${dupText ? 'bg-[#FEE2E2]' : proxyText ? 'bg-[#FEF9C3]' : 'bg-white'} border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[13px] font-mono font-bold text-[#008BC5]">{emp.code}</span>
                    <h4 className="text-[18px] font-bold text-[#0F172A] leading-tight">{emp.name}</h4>
                  </div>
                  {isChecked ? (
                    <Badge variant="success" icon={CheckCircle2}>Đã điểm danh</Badge>
                  ) : (
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="warning" icon={Clock}>Chưa điểm danh</Badge>
                      <button
                        type="button"
                        onClick={() => openManualModal(emp.code)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-semibold text-[#008BC5] bg-[#EAF6FF] hover:bg-[#D0EDFF] rounded-lg transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        Điểm danh hộ
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[14px] text-[#334155] space-y-1 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  <div>Khối: <strong>{emp.blockId ? blockMap.get(emp.blockId) : '—'}</strong></div>
                  <div>Phòng: <strong>{emp.departmentId ? deptMap.get(emp.departmentId) : '—'}</strong></div>
                  <div>Nhóm: <strong>{g?.name || '—'}</strong></div>
                  {dupText && <div className="text-[#B91C1C] font-bold">{dupText}</div>}
                  {proxyText && <div className="text-[#854D0E] font-bold">{proxyText}</div>}
                  {rec && (
                    <div className="text-[#15803D] font-bold pt-1 border-t border-[#E2E8F0]">
                      Ghế: {rec.seatId ? seatBadgeText(rec.seatId) : 'Không có ghế'} • Lúc: {new Date(rec.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* MODAL ĐIỂM DANH HỘ */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#EAF6FF] rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#008BC5]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#0F172A]">Điểm danh hộ</h2>
                  <p className="text-[13px] text-[#64748B]">Dành cho người không quét được QR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Chọn nhân viên */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#0F172A] block">
                  Chọn nhân viên <span className="text-red-500">*</span>
                </label>

                {manualEmpCode ? (
                  /* Đã chọn NV – hiển thị thẻ */
                  (() => {
                    const selectedEmp = employees.find(
                      (e) => e.code.toUpperCase() === manualEmpCode.toUpperCase()
                    );
                    return (
                      <div className="flex items-center justify-between p-3 bg-[#EAF6FF] border border-[#B8DCEF] rounded-xl">
                        <div>
                          <span className="text-[13px] font-mono font-bold text-[#008BC5]">
                            {selectedEmp?.code || manualEmpCode}
                          </span>
                          <p className="text-[16px] font-bold text-[#0F172A]">
                            {selectedEmp?.name || 'Không tìm thấy'}
                          </p>
                          {selectedEmp?.blockId && (
                            <span className="text-[13px] text-[#64748B]">
                              {blockMap.get(selectedEmp.blockId) || ''}
                              {selectedEmp.departmentId
                                ? ` • ${deptMap.get(selectedEmp.departmentId) || ''}`
                                : ''}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setManualEmpCode('')}
                          className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] px-2 py-1 rounded cursor-pointer"
                        >
                          Đổi
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  /* Chưa chọn – hiển thị ô tìm kiếm + danh sách */
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="text"
                        value={manualSearchTerm}
                        onChange={(e) => setManualSearchTerm(e.target.value)}
                        placeholder="Tìm theo mã NV hoặc họ tên..."
                        className="w-full min-h-[44px] pl-9 pr-4 py-2 text-[15px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-[200px] overflow-y-auto border border-[#E2E8F0] rounded-xl divide-y divide-[#F1F5F9]">
                      {filteredModalEmployees.length === 0 ? (
                        <div className="p-4 text-center text-[14px] text-[#94A3B8]">
                          {manualSearchTerm
                            ? 'Không tìm thấy nhân viên phù hợp.'
                            : 'Tất cả nhân viên đã điểm danh.'}
                        </div>
                      ) : (
                        filteredModalEmployees.slice(0, 50).map((emp) => (
                          <button
                            key={emp.code}
                            type="button"
                            onClick={() => setManualEmpCode(emp.code)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left"
                          >
                            <div>
                              <span className="text-[13px] font-mono font-bold text-[#008BC5]">
                                {emp.code}
                              </span>
                              <p className="text-[15px] font-medium text-[#0F172A]">{emp.name}</p>
                            </div>
                            <span className="text-[12px] text-[#94A3B8]">
                              {emp.blockId ? blockMap.get(emp.blockId) : ''}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    {filteredModalEmployees.length > 50 && (
                      <p className="text-[12px] text-[#94A3B8] text-center">
                        Hiển thị 50 / {filteredModalEmployees.length} kết quả — hãy gõ tìm chính xác hơn.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Lý do */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold text-[#0F172A] block">
                  Lý do điểm danh hộ <span className="text-red-500">*</span>
                </label>
                {/* Lý do nhanh */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setManualReason(r)}
                      className={`px-3 py-1.5 text-[13px] font-medium rounded-full border transition-colors cursor-pointer ${
                        manualReason === r
                          ? 'bg-[#008BC5] text-white border-[#008BC5]'
                          : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#EAF6FF]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Nhập lý do (bắt buộc) — VD: Quên điện thoại, Camera hỏng..."
                  rows={2}
                  className="w-full min-h-[60px] px-4 py-2.5 text-[15px] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5] resize-none"
                />
              </div>

              {/* Thông tin audit */}
              <div className="flex items-start gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B]">
                <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Hành động này được ghi nhật ký kiểm toán, bao gồm tên người thực hiện, thời gian và lý do.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <Button
                variant="secondary"
                onClick={() => setShowManualModal(false)}
                disabled={manualLoading}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleManualCheckIn}
                disabled={manualLoading || !manualEmpCode.trim() || !manualReason.trim()}
                icon={CheckCircle2}
              >
                {manualLoading ? 'Đang xử lý...' : 'Xác nhận điểm danh hộ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}