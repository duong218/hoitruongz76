import React, { useState, useMemo, useRef } from 'react';
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
import { HallSchematic } from '../../components/hall/HallSchematic.jsx';
import { ScannerModal } from '../../components/attendance/ScannerModal.jsx';
import { summarizeSeats } from '../../utils/seatSummary.js';
import { seatLabel } from '../../utils/seatLabel.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { validateCheckIn, CHECKIN_CODES } from '../../utils/checkIn.js';
import {
  AlertTriangle,
  Navigation,
  MapPin,
  QrCode,
  CheckCircle2,
  Clock,
  Map as MapIcon,
} from 'lucide-react';

export function SeatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { seatGroups } = useSeatAssignments();
  const { groups } = useGroups();
  const { attendance, checkIn } = useAttendance();
  const { event } = useEventSettings();
  const toast = useToast();

  const [scannerOpen, setScannerOpen] = useState(false);
  const mapRef = useRef(null);

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

  // Tách "Hàng 3 (cả hàng), Hàng 8 (bên trái, ghế 6-10)" thành từng dòng dễ đọc
  const seatRows = useMemo(() => {
    const parts = seatDescription.match(/Hàng \d+ \([^)]*\)/g) || [];
    return parts.map((p) => {
      const m = p.match(/^(Hàng \d+) \((.*)\)$/);
      return { title: m[1], detail: m[2] };
    });
  }, [seatDescription]);

  // Xử lý kết quả quét hoặc nhập mã từ ScannerModal
  const handleScanResult = async ({ seat, token, error: scanError }) => {
    if (scanError) {
      toast.warning(scanError);
      return;
    }
    if (!seat && !token) {
      toast.error('Vui lòng cung cấp mã ghế.');
      return;
    }
    try {
      const record = await checkIn({ employeeCode: user.code, seatId: seat || '', token });
      setScannerOpen(false);
      const successSeat = record?.seatId || seat;
      toast.success(
        successSeat
          ? `Điểm danh thành công tại ${seatLabel(successSeat)}!`
          : 'Điểm danh thành công!'
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Mã ghế không hợp lệ hoặc sai vị trí.';
      if (msg.includes('đã điểm danh rồi')) {
        setScannerOpen(false);
        toast.info(msg);
      } else {
        toast.error(msg);
      }
      throw err; // Ném tiếp để ScannerModal hiển thị lỗi trực tiếp trong modal
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
    <div className={`space-y-3 sm:space-y-5 max-w-3xl mx-auto w-full ${needCheckIn ? 'pb-32' : 'pb-6'}`}>
      {/* Card thông tin chỗ ngồi */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-4 sm:p-6 space-y-3">
        {/* Họ tên, mã và nhóm */}
        <div className="pb-3 border-b border-[#E2E8F0] flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[14px] text-[#334155] font-mono">{user.code}</span>
          <div>
            {group ? (
              <GroupBadge name={group.name} color={group.color} />
            ) : (
              <Badge variant="warning" icon={AlertTriangle}>
                Chưa có nhóm
              </Badge>
            )}
          </div>
        </div>

        {/* Trạng thái điểm danh luôn ở trên cùng để biết ngay đã xong chưa */}
        {myAttendance && (
          <div className="p-4 bg-[#F0FDF4] border-2 border-[#22C55E] rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 text-[#22C55E] shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-[18px] font-bold text-[#166534] leading-6">
                Bạn đã điểm danh thành công
              </h4>
              <p className="text-[16px] font-semibold text-[#0F172A] mt-1">
                Vị trí: {myAttendance.seatId ? seatLabel(myAttendance.seatId) : 'Ban tổ chức điểm danh hộ'}
              </p>
              <div className="flex items-center gap-1.5 text-[16px] text-[#166534] mt-1">
                <Clock className="w-4 h-4" />
                <span>
                  Lúc {new Date(myAttendance.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        )}

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
            <p className="flex items-center gap-2 text-[16px] leading-6 text-[#0F172A]">
              <Navigation className="w-5 h-5 shrink-0 text-[#008BC5]" />
              <span>Bạn thuộc <strong style={{ color: group.color }}>{group.name}</strong>. Hãy tới đây ngồi:</span>
            </p>

            {seatRows.length > 0 ? (
              <ul className="flex flex-wrap gap-2 list-none p-0">
                {seatRows.map((r) => (
                  <li
                    key={r.title}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F6F8FA] border border-[#E2E8F0] border-l-4 border-l-[#008BC5] rounded-lg"
                  >
                    <MapPin className="w-4 h-4 text-[#008BC5] shrink-0" />
                    <span className="text-[18px] font-bold leading-6 text-[#0F172A]">{r.title}</span>
                    <span className="text-[15px] text-[#334155]">{r.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-3 bg-[#F6F8FA] border border-[#E2E8F0] border-l-4 border-l-[#008BC5] rounded-lg text-[18px] font-bold text-[#0F172A]">
                {seatDescription}
              </p>
            )}

            <p className="hidden sm:block text-[16px] leading-6 text-[#334155]">
              Tìm các ghế nhấp nháy màu <strong style={{ color: group.color }}>{group.name}</strong> và đi theo đường nét đứt từ Cửa vào.
            </p>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              icon={MapIcon}
              className="sm:!hidden !text-[#008BC5] !border-[#008BC5] !border-[1.5px]"
              onClick={() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Định vị chỗ ngồi trên sơ đồ
            </Button>
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
      </div>

      {/* Sơ đồ hội trường 2D */}
      <div ref={mapRef} className="space-y-2 scroll-mt-[72px]">
        <div className="hidden sm:flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[16px] font-semibold text-[#0F172A]">
            Sơ đồ định vị hội trường 2D
          </h3>
          <span className="text-[14px] text-[#334155]">
            {hasSeats ? 'Theo dõi đường đi từ Cửa vào' : 'Hiện chưa phân bổ chỗ'}
          </span>
        </div>

        {/* Điện thoại: sơ đồ rút gọn chữ to. Màn hình lớn: sơ đồ 2D đầy đủ. */}
        <div className="sm:hidden">
          <HallSchematic seatGroups={seatGroups} highlightGroupId={hasSeats ? group?.id : null} color={group?.color} />
        </div>
        <div className="hidden sm:block">
          <HallMap
            mode="view"
            seatGroups={seatGroups}
            groups={groups}
            highlightGroupId={hasSeats ? group?.id : null}
          />
        </div>
      </div>

      {/* Thanh hành động điểm danh cố định đáy màn hình (chỉ hiện khi nhân viên cần điểm danh và chưa điểm danh) */}
      {needCheckIn && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_10px_rgba(15,23,42,0.1)] px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] z-40">
          <div className="max-w-md mx-auto space-y-1 text-center">
            <p className="text-[14px] text-[#334155]">
              Bước 4: Ngồi vào ghế, bấm nút dưới rồi <strong>quét mã QR dán trên ghế</strong>.
            </p>
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
              <p className="text-[14px] font-semibold text-[#C53030]">
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