import React, { useState } from 'react';
import { Logo } from '../../components/ui/Logo.jsx';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { DEMO_MODE } from '../../constants/app.js';
import { ATTENDEE_LOGIN_CODES } from '../../services/attendeeService.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { GuideAnimation } from '../../components/ui/GuideAnimation.jsx';
import { UserCheck, User, ShieldAlert, IdCard, MapPin, QrCode, ScanLine, ShieldCheck, CircleHelp } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNextUrl = searchParams.get('next');
  // Chống Open Redirect: Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng "/" và không phải "//"
  const safeNextUrl = (rawNextUrl && rawNextUrl.startsWith('/') && !rawNextUrl.startsWith('//')) 
    ? rawNextUrl 
    : '/seat';

  const { attendee, loading: authLoading, loginWithCode, loginAsGuest, logoutAttendee } = useAuth();
  const { event } = useEventSettings();

  const [isGuestMode, setIsGuestMode] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [isStaffCode, setIsStaffCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsStaffCode(false);

    const trimmed = employeeCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Vui lòng nhập mã nhân viên.');
      return;
    }

    try {
      setLoading(true);
      const result = await loginWithCode(trimmed);

      // Nếu mã thuộc tài khoản Quản trị / Quản lý -> Từ chối đăng nhập tại trang công khai
      if (result.code === ATTENDEE_LOGIN_CODES.ROLE_NEEDS_PASSWORD) {
        setIsStaffCode(true);
        setError('Mã này dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị.');
        return;
      }

      if (!result.ok) {
        setError(result.message || 'Không tìm thấy mã nhân viên này. Vui lòng kiểm tra lại.');
        return;
      }

      navigate(safeNextUrl);
    } catch (err) {
      setError(err.message || 'Không tìm thấy mã nhân viên này. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsStaffCode(false);

    const trimmed = guestName.trim();
    if (!trimmed) {
      setError('Vui lòng nhập họ và tên của quý khách.');
      return;
    }

    try {
      setLoading(true);
      const result = await loginAsGuest(trimmed);
      if (result.ok) {
        navigate(safeNextUrl);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi xác nhận thông tin khách mời.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (code) => {
    setEmployeeCode(code);
    setIsGuestMode(false);
    setError('');
    setIsStaffCode(false);
  };

  // Chờ đọc xong phiên đã lưu để form không nháy lên rồi biến mất
  if (authLoading) return null;

  // Đã đăng nhập rồi (ví dụ bấm Back về đây): không hiện lại form nhập mã.
  // Không tự chuyển đi để nút Back vẫn dùng được, người dùng chọn đi tiếp hoặc đổi người.
  if (attendee) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-6 sm:py-12">
        <div className="w-full max-w-md sm:max-w-lg bg-white border border-[#E2E8F0] border-t-4 border-t-[#008BC5] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-5 sm:p-8 space-y-5 text-center">
          <Logo className="w-16 h-16 inline-block" />
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0F172A]">Bạn đã đăng nhập</h1>
          <p className="text-[18px] text-[#334155]">
            <strong>{attendee.name}</strong>
            {attendee.groupName ? ` • ${attendee.groupName}` : ''}
          </p>
          <Button type="button" variant="primary" fullWidth size="lg" icon={MapPin} onClick={() => navigate('/seat')}>
            Xem chỗ ngồi của tôi
          </Button>
          <Button type="button" variant="secondary" fullWidth icon={User} onClick={() => logoutAttendee()}>
            Đăng nhập người khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-6 sm:py-12">
      <div className="w-full max-w-md sm:max-w-lg bg-white border border-[#E2E8F0] border-t-4 border-t-[#008BC5] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-5 sm:p-8 space-y-6">
        {/* Tiêu đề sự kiện */}
        <div className="text-center space-y-2">
          <Logo className="w-16 h-16 mb-2 inline-block" />
          <h1 className="text-balance text-[24px] sm:text-[32px] font-bold text-[#0F172A] leading-tight sm:leading-[40px]">
            {event.eventName || 'Hội nghị Triển khai Nhiệm vụ Z176'}
          </h1>
          <p className="text-[16px] text-[#334155] font-medium">
            Xem vị trí chỗ ngồi & Điểm danh
          </p>
        </div>

        {/* 4 bước thực hiện: số thứ tự + biểu tượng, bước hiện tại được tô đậm */}
        <ol className="grid grid-cols-4 gap-1.5 list-none p-0">
          {[
            { icon: QrCode, text: 'Quét mã QR', hint: 'ở cửa vào', done: true },
            { icon: IdCard, text: 'Nhập mã', hint: 'trên thẻ' },
            { icon: MapPin, text: 'Xem chỗ', hint: 'theo bản đồ' },
            { icon: ScanLine, text: 'Quét điểm danh', hint: 'tại ghế' },
          ].map(({ icon: Icon, text, hint, done }, i) => (
            <li key={text} className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2.5 text-center text-[13px] font-semibold leading-4 ${done ? 'bg-[#F1F5F9] text-[#64748B]' : i === 1 ? 'bg-[#008BC5] text-white ring-2 ring-[#BAE3F7]' : 'bg-[#EAF6FF] text-[#008BC5]'}`}>
              <Icon className="w-5 h-5" />
              <span>{i + 1}. {text}</span>
              <span className="text-[12px] font-normal opacity-80">{done ? '✓ Bạn đã xong' : hint}</span>
            </li>
          ))}
        </ol>

        {/* Nút xem hướng dẫn nhỏ + bảng 4 bước có hiệu ứng nhẹ */}
        <div className="-mt-3 text-center">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            aria-expanded={showGuide}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-[14px] font-medium text-[#008BC5] cursor-pointer"
          >
            <CircleHelp className="w-4 h-4" />
            {showGuide ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn'}
          </button>
          {showGuide && <GuideAnimation />}
        </div>

        {/* Chế độ Nhân viên */}
        {!isGuestMode ? (
          <form onSubmit={handleEmployeeSubmit} className="space-y-4">
            <Input
              label="Mã nhân viên"
              id="employee-code-input"
              value={employeeCode}
              onChange={(e) => {
                setEmployeeCode(e.target.value.toUpperCase());
                setError('');
                setIsStaffCode(false);
              }}
              placeholder="Ví dụ: NV001"
              icon={IdCard}
              helperText="Mã nhân viên có trên thẻ của bạn."
              autoComplete="off"
              autoCapitalize="characters"
              error={!isStaffCode ? error : ''}
              disabled={loading}
              required
              autoFocus
            />

            {/* Thông báo riêng và nút phụ khi nhập mã Quản trị / Quản lý */}
            {isStaffCode && (
              <div className="p-3.5 bg-[#FEF9EE] border-l-4 border-l-[#F6AD37] border-y border-r border-[#FDE68A] rounded-r-lg space-y-2.5">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
                  <p className="text-[15px] font-semibold text-[#B45309]">
                    Mã này dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  size="md"
                  onClick={() => navigate('/quan-tri/login')}
                >
                  Đến trang đăng nhập quản trị
                </Button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              icon={MapPin}
            >
              Xem chỗ ngồi cho nhân viên
            </Button>

            {event.guestEnabled && (
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  icon={UserCheck}
                  className="!text-[#008BC5] !border-[#008BC5] !border-[1.5px] active:!bg-[#F0F9FF]"
                  onClick={() => {
                    setIsGuestMode(true);
                    setError('');
                    setIsStaffCode(false);
                  }}
                  disabled={loading}
                >
                  Tôi là khách mời
                </Button>
              </div>
            )}
          </form>
        ) : (
          /* Chế độ Khách mời */
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[14px] text-[#334155]">
              Quý khách vui lòng nhập họ và tên để hệ thống hướng dẫn tới khu vực ghế dành riêng cho <strong>Khách mời</strong>.
            </div>

            <Input
              label="Họ và tên"
              id="guest-name-input"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                setError('');
              }}
              placeholder="Ví dụ: Thiếu tướng Nguyễn Văn A..."
              maxLength={60}
              error={error}
              disabled={loading}
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              icon={User}
            >
              Xem chỗ ngồi cho khách 
            </Button>

            <div className="pt-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  setIsGuestMode(false);
                  setError('');
                  setIsStaffCode(false);
                }}
                disabled={loading}
              >
                Quay lại đăng nhập bằng mã nhân viên
              </Button>
            </div>
          </form>
        )}

        {/* Bảng trợ giúp mã thử nghiệm: CHỈ hiển thị nhân viên thường (NV001...) khi DEMO_MODE = true */}
        {DEMO_MODE && (
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <span className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
              Mã thử nghiệm nhanh (Demo):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { code: 'NV001', label: 'NV001 (Đã điểm danh)' },
                { code: 'NV002', label: 'NV002 (Cần điểm danh)' },
                { code: 'NV003', label: 'NV003 (Miễn điểm danh)' },
                { code: 'NV004', label: 'NV004 (Cần điểm danh)' },
                { code: 'NV005', label: 'NV005 (Chưa có chỗ)' },
                { code: 'NV006', label: 'NV006 (Đã điểm danh)' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleQuickFill(item.code)}
                  className="px-2.5 py-1 text-[13px] font-semibold bg-[#F1F5F9] hover:bg-[#EAF6FF] hover:text-[#008BC5] text-[#334155] rounded border border-[#E2E8F0] transition-colors cursor-pointer min-h-[36px]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chân trang: Link chữ nhỏ màu #64748B dẫn tới /quan-tri/login */}
        <div className="pt-3 border-t border-[#E2E8F0] text-center">
          <Link
            to="/quan-tri/login"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 text-[16px] font-medium text-[#008BC5] underline hover:text-[#006BA1] transition-colors"
          >
            <ShieldCheck className="w-[18px] h-[18px]" />
            Đăng nhập quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}