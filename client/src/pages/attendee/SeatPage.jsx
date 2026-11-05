import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useToast } from '../../context/ToastContext.jsx';
import { GroupBadge } from '../../components/ui/GroupBadge.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { ScannerModal } from '../../components/attendance/ScannerModal.jsx';
import { summarizeSeats } from '../../utils/seatSummary.js';
import { seatLabel } from '../../utils/seatLabel.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { validateCheckIn, CHECKIN_CODES } from '../../utils/checkIn.js';
import {
  ArrowLeft,
  AlertTriangle,
  Navigation,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function SeatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { seatGroups } = useSeatAssignments();
  const { groups } = useGroups();
  const { attendance, checkIn } = useAttendance();
  const { event } = useEventSettings();
  const toast = useToast();

  const [scannerOpen, setScannerOpen] = useState(false);

  // Nhóm của người dùng được xác định theo Khối (hoặc Khách mời)
  const group = useMemo(() => {
    return resolveGroup(user, groups);
  }, [user, groups]);

  // Kiểm tra nhân viên này đã điểm danh chưa
  const myAttendance = useMemo(() => {
    if (!user) return null;
    return attendance.find(
      (a) => a.employeeCode?.toUpperCase() === user.code?.toUpperCase()
    );
  }, [user, attendance]);

  // Các ghế thuộc nhóm này
  const myGroupSeatIds = useMemo(() => {
    if (!group) return [];
    return Object.entries(seatGroups)
      .filter(([_, gId]) => gId === group.id)
      .map(([sId]) => sId);
  }, [group, seatGroups]);

  const hasSeats = myGroupSeatIds.length > 0;
  const seatDescription = useMemo(() => {
    return summarizeSeats(myGroupSeatIds);
  }, [myGroupSeatIds]);

  const handleBack = async () => {
    await logout();
    navigate('/login');
  };

  // Xử lý kết quả quét từ ScannerModal
  const handleScanResult = async ({ seat, token, error: scanError }) => {
    if (scanError) {
      toast.warning(scanError);
      return;
    }
    if (!seat) {
      toast.error('Không tìm thấy thông tin ghế từ mã QR này.');
      return;
    }
    try {
      const record = await checkIn({ employeeCode: user.code, seatId: seat, token });
      setScannerOpen(false);
      toast.success(`Điểm danh thành công tại ${seatLabel(seat)}!`);
      // Cập nhật ngay lập tức nếu cần
    } catch (err) {
      const msg = err.message || 'Lỗi khi lưu kết quả điểm danh.';
      if (msg.includes('đã điểm danh rồi')) {
        setScannerOpen(false);
        toast.info(msg);
      } else {
        toast.error(msg);
      }
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  // Cần hiển thị thanh điểm danh nếu:
  // - Thuộc nhóm có checkInRequired = true
  // - Chưa điểm danh
  const needCheckIn = group && group.checkInRequired && !myAttendance;

  return (
    <div className="space-y-5 max-w-3xl mx-auto w-full pb-20">
      {/* Nút Quay lại */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-[16px] font-semibold text-[#008BC5] hover:text-[#0072A3] transition-colors py-2 px-1 min-h-[44px] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại đăng nhập</span>
        </button>
      </div>

      {/* Card thông tin chỗ ngồi */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-5 sm:p-6 space-y-4">
        {/* Hàng trên: Họ tên & GroupBadge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider block">
              Người tham dự
            </span>
            <h2 className="text-[22px] sm:text-[24px] font-extrabold text-[#0F172A] leading-tight">
              {user.name}
            </h2>
            <span className="text-[14px] text-[#64748B] font-mono">
              Mã: {user.code}
            </span>
          </div>

          <div>
            {group ? (
              <GroupBadge name={group.name} color={group.color} size="lg" />
            ) : (
              <Badge variant="warning" icon={AlertTriangle}>
                Chưa có nhóm
              </Badge>
            )}
          </div>
        </div>

        {/* TH1: Người dùng không khớp nhóm nào */}
        {!group ? (
          <div className="p-4 bg-[#FEF9EE] border-l-4 border-l-[#F6AD37] border-y border-r border-[#FDE68A] rounded-r-lg space-y-1">
            <p className="text-[18px] font-bold text-[#B45309]">
              Bạn chưa được xếp vào nhóm nào.
            </p>
            <p className="text-[16px] text-[#78350F]">
              Khối trực thuộc của bạn chưa được liên kết với khu vực ghế nào. Vui lòng liên hệ ban tổ chức để được hỗ trợ.
            </p>
          </div>
        ) : hasSeats ? (
          /* TH2: Có nhóm và đã có ghế được sắp */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#008BC5]">
              <Navigation className="w-5 h-5 shrink-0" />
              <span className="text-[15px] font-bold uppercase tracking-wider">
                Vị trí được sắp xếp
              </span>
            </div>

            <p className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] leading-snug">
              Bạn thuộc{' '}
              <span style={{ color: group.color }}>
                [{group.name}]
              </span>
              . Hãy tới vị trí này ngồi:
            </p>

            <div className="p-4 bg-[#F8FAFC] border-l-4 border-l-[#008BC5] border-y border-r border-[#E2E8F0] rounded-r-lg">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-[#008BC5] shrink-0 mt-0.5" />
                <p className="text-[18px] sm:text-[20px] font-extrabold text-[#0F172A]">
                  {seatDescription}
                </p>
              </div>
              <p className="text-[14px] text-[#64748B] mt-1 pl-7">
                Quan sát các ghế nhấp nháy màu{' '}
                <strong style={{ color: group.color }}>
                  {group.name}
                </strong>{' '}
                và đi theo đường nét đứt dẫn từ Cửa vào.
              </p>
            </div>
          </div>
        ) : (
          /* TH3: Nhóm chưa có ghế nào */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="warning" icon={AlertTriangle}>
                Chưa có chỗ
              </Badge>
            </div>
            <div className="p-4 bg-[#FEF9EE] border-l-4 border-l-[#F6AD37] border-y border-r border-[#FDE68A] rounded-r-lg space-y-1">
              <p className="text-[18px] font-bold text-[#B45309]">
                Ban tổ chức chưa sắp chỗ cho nhóm của bạn.
              </p>
              <p className="text-[16px] text-[#78350F]">
                Vui lòng liên hệ ban tổ chức tại bàn lễ tân để được hướng dẫn chi tiết.
              </p>
            </div>
          </div>
        )}

        {/* THÀNH CÔNG: Nếu đã điểm danh xong, hiện Card xác nhận điểm danh */}
        {myAttendance && (
          <div className="p-4 bg-[#F0FDF4] border-2 border-[#22C55E] rounded-xl flex items-start gap-3 shadow-[0_1px_3px_rgba(34,197,94,0.15)] animate-in fade-in">
            <CheckCircle2 className="w-7 h-7 text-[#22C55E] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[18px] font-bold text-[#15803D] leading-tight">
                Bạn đã điểm danh thành công
              </h4>
              <p className="text-[16px] font-extrabold text-[#0F172A] mt-1">
                Vị trí: {seatLabel(myAttendance.seatId)}
              </p>
              <div className="flex items-center gap-1.5 text-[14px] text-[#15803D] mt-1 font-medium">
                <Clock className="w-4 h-4" />
                <span>
                  Thời gian ghi nhận: {new Date(myAttendance.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sơ đồ hội trường 2D */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#0F172A]">
            Sơ đồ định vị hội trường 2D
          </h3>
          <span className="text-[14px] text-[#64748B]">
            {hasSeats ? 'Theo dõi đường đi từ Cửa vào' : 'Hiện chưa phân bổ chỗ'}
          </span>
        </div>

        <HallMap
          mode="view"
          seatGroups={seatGroups}
          groups={groups}
          highlightGroupId={hasSeats ? group?.id : null}
        />
      </div>

      {/* Thanh hành động điểm danh cố định đáy màn hình (chỉ hiện khi nhân viên cần điểm danh và chưa điểm danh) */}
      {needCheckIn && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_10px_rgba(15,23,42,0.1)] p-4 pb-[env(safe-area-inset-bottom,16px)] z-40">
          <div className="max-w-md mx-auto space-y-1 text-center">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={!event.checkInOpen}
              onClick={() => setScannerOpen(true)}
              icon={QrCode}
            >
              Điểm danh tại ghế ngồi
            </Button>
            {!event.checkInOpen && (
              <p className="text-[13px] font-bold text-[#E53E3E]">
                Ban tổ chức chưa mở điểm danh
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal quét mã QR điểm danh */}
      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanResult={handleScanResult}
        userGroupSeats={myGroupSeatIds}
        allSeatGroups={seatGroups}
        seatTokens={event.seatTokens || {}}
      />
    </div>
  );
}
