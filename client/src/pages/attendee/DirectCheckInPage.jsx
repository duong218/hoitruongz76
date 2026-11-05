import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { validateCheckIn, CHECKIN_CODES } from '../../utils/checkIn.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { seatLabel } from '../../utils/seatLabel.js';
import { Button } from '../../components/ui/Button.jsx';
import { CheckCircle2, AlertTriangle, ArrowRight, Clock, MapPin } from 'lucide-react';

export function DirectCheckInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const seatParam = searchParams.get('seat') || '';
  const tokenParam = searchParams.get('k') || '';

  const { user, loading: authLoading } = useAuth();
  const { seatGroups, loading: seatLoading } = useSeatAssignments();
  const { groups, loading: grpLoading } = useGroups();
  const { attendance, checkIn, loading: attLoading } = useAttendance();
  const { event, loading: evtLoading } = useEventSettings();

  const [result, setResult] = useState(null);
  const [processed, setProcessed] = useState(false);

  const group = useMemo(() => {
    return resolveGroup(user, groups);
  }, [user, groups]);

  useEffect(() => {
    if (authLoading || seatLoading || grpLoading || attLoading || evtLoading) return;

    // Chưa đăng nhập -> chuyển đến /login kèm tham số next
    if (!user) {
      const returnUrl = location.pathname + location.search;
      navigate(`/login?next=${encodeURIComponent(returnUrl)}`, { replace: true });
      return;
    }

    if (processed) return;

    // Đã đăng nhập -> gửi yêu cầu điểm danh lên Server xác thực
    checkIn({ employeeCode: user.code, seatId: seatParam, token: tokenParam })
      .then((record) => {
        setResult({
          success: true,
          title: 'Điểm danh thành công!',
          message: 'Hệ thống đã ghi nhận sự có mặt của bạn tại hội trường.',
          seat: seatParam,
          time: record?.checkedInAt || new Date().toISOString(),
        });
        setProcessed(true);
      })
      .catch((err) => {
        const msg = err.message || 'Không thể lưu điểm danh.';
        if (msg.includes('đã điểm danh rồi')) {
          setResult({
            success: true,
            title: 'Đã điểm danh trước đó',
            message: msg,
            seat: seatParam,
            time: new Date().toISOString(),
          });
        } else {
          setResult({
            success: false,
            title: 'Điểm danh không hợp lệ',
            message: msg,
          });
        }
        setProcessed(true);
      });
  }, [
    authLoading,
    seatLoading,
    grpLoading,
    attLoading,
    evtLoading,
    user,
    group,
    seatGroups,
    seatParam,
    tokenParam,
    event,
    attendance,
    processed,
    navigate,
    location,
    checkIn,
  ]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#EAF6FF] text-[#008BC5] flex items-center justify-center font-bold text-[18px] mx-auto mb-3">
            Z176
          </div>
          <h2 className="text-[22px] font-extrabold text-[#0F172A]">
            Điểm danh trực tiếp tại ghế
          </h2>
        </div>

        {!result ? (
          <div className="p-8 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-[#008BC5] border-t-transparent rounded-full animate-spin" />
            <span className="text-[16px] font-medium">Đang xử lý kết quả điểm danh...</span>
          </div>
        ) : result.success ? (
          /* Card Thành công */
          <div className="p-5 bg-[#F0FDF4] border-2 border-[#22C55E] rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#22C55E] shrink-0" />
              <div>
                <h3 className="text-[18px] font-bold text-[#15803D]">
                  {result.title}
                </h3>
                <p className="text-[14px] text-[#15803D] mt-0.5">
                  {result.message}
                </p>
              </div>
            </div>

            {result.seat && (
              <div className="pt-2 border-t border-[#BBF7D0] space-y-1">
                <div className="flex items-center gap-2 text-[16px] font-extrabold text-[#0F172A]">
                  <MapPin className="w-5 h-5 text-[#22C55E] shrink-0" />
                  <span>Vị trí: {seatLabel(result.seat)}</span>
                </div>
                <div className="flex items-center gap-2 text-[14px] text-[#64748B]">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Giờ ghi nhận: {new Date(result.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Card Báo lỗi */
          <div className="p-5 bg-[#FEECEC] border-2 border-[#E53E3E] rounded-xl space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-[#E53E3E] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[18px] font-bold text-[#B91C1C]">
                  {result.title}
                </h3>
                <p className="text-[15px] text-[#7F1D1D] mt-1 font-medium leading-relaxed">
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nút về trang chỗ ngồi */}
        <div className="pt-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => navigate('/seat')}
            icon={ArrowRight}
            iconPosition="right"
          >
            Về trang sơ đồ chỗ ngồi
          </Button>
        </div>
      </div>
    </div>
  );
}
