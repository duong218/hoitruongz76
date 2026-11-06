import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { DEMO_MODE } from '../../constants/app.js';
import { ROLES } from '../../constants/roles.js';
import { Button } from '../../components/ui/Button.jsx';
import { ShieldCheck, Lock, User, ArrowLeft } from 'lucide-react';

export function StaffLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNextUrl = searchParams.get('next');
  // Chống Open Redirect: chỉ chấp nhận URL nội bộ bắt đầu bằng / và không bắt đầu bằng //
  const safeNextUrl = (rawNextUrl && rawNextUrl.startsWith('/') && !rawNextUrl.startsWith('//'))
    ? rawNextUrl
    : null;

  const { staff, loading: authLoading, loginStaff, logoutStaff } = useAuth();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedCode = code.trim().toUpperCase();
    const trimmedPass = password.trim();

    if (!trimmedCode || !trimmedPass) {
      setError('Mã hoặc mật khẩu không đúng.');
      return;
    }

    try {
      setLoading(true);
      const staffUser = await loginStaff(trimmedCode, trimmedPass);

      // Điều hướng sau đăng nhập thành công
      if (safeNextUrl) {
        // Kiểm tra quyền đối với safeNextUrl
        if (safeNextUrl.startsWith('/admin') && staffUser.role !== ROLES.ADMIN) {
          navigate('/manager/dashboard');
          return;
        }
        if (safeNextUrl.startsWith('/manager') && staffUser.role !== ROLES.MANAGER) {
          navigate('/admin/dashboard');
          return;
        }
        navigate(safeNextUrl);
        return;
      }

      if (staffUser.role === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/manager/dashboard');
      }
    } catch {
      // Bất kể lỗi gì (sai mã, sai pass, mã nhân viên thường): luôn hiện cùng 1 câu lỗi
      setError('Mã hoặc mật khẩu không đúng.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoCode, demoPass) => {
    setCode(demoCode);
    setPassword(demoPass);
    setError('');
  };

  // Chờ đọc xong phiên đã lưu để form không nháy lên rồi biến mất
  if (authLoading) return null;

  // Đã đăng nhập (và chưa hết hạn): không hiện lại form. Không tự chuyển đi để nút Back vẫn dùng được.
  if (staff && !(staff.expiresAt && Date.now() > staff.expiresAt)) {
    const home = staff.role === ROLES.ADMIN ? '/admin/dashboard' : '/manager/dashboard';
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-center items-center p-4 sm:p-6 text-[#0F172A]">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EAF6FF] text-[#008BC5]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#0F172A] leading-tight">Bạn đã đăng nhập</h1>
          <p className="text-[18px] text-[#334155]">
            <strong>{staff.name}</strong> • {staff.role === ROLES.ADMIN ? 'Quản trị viên' : 'Quản lý'}
          </p>
          <Button type="button" variant="primary" fullWidth size="lg" icon={ShieldCheck} onClick={() => navigate(home)}>
            Vào trang quản trị
          </Button>
          <Button type="button" variant="secondary" fullWidth icon={User} onClick={() => logoutStaff()}>
            Đăng nhập tài khoản khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-center items-center p-4 sm:p-6 text-[#0F172A]">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-6 sm:p-8 space-y-6">
        {/* Header khối */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EAF6FF] text-[#008BC5] font-bold text-[18px] mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#0F172A] leading-tight">
            Đăng nhập quản trị
          </h1>
          <p className="text-[16px] text-[#64748B]">
            Dành cho quản trị viên và quản lý hội trường
          </p>
        </div>

        {/* Thông báo lỗi (nếu có) */}
        {error && (
          <div
            role="alert"
            className="p-3.5 bg-[#FEECEC] border-l-4 border-l-[#E53E3E] border-y border-r border-[#FECACA] rounded-r-lg text-[15px] font-semibold text-[#B91C1C]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mã tài khoản */}
          <div className="space-y-1.5">
            <label
              htmlFor="staff-code-input"
              className="block text-[16px] font-semibold text-[#0F172A]"
            >
              Mã tài khoản
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                id="staff-code-input"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Nhập tài khoản"
                disabled={loading}
                required
                autoFocus
                className="w-full min-h-[48px] pl-11 pr-4 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1.5">
            <label
              htmlFor="staff-password-input"
              className="block text-[16px] font-semibold text-[#0F172A]"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                id="staff-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                required
                className="w-full min-h-[48px] pl-11 pr-16 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[44px] px-2 flex items-center justify-center text-[14px] font-bold text-[#008BC5] hover:text-[#0072A3] rounded transition-colors cursor-pointer select-none"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              icon={ShieldCheck}
            >
              Đăng nhập
            </Button>
          </div>
        </form>

        {/* Khối Tài khoản thử (chỉ khi DEMO_MODE = true) */}
        {DEMO_MODE && (
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <span className="block text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
              Tài khoản thử (Demo):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('ADMIN01', 'admin123')}
                className="min-h-[48px] px-3 py-2 text-[14px] font-bold bg-[#F8FAFC] hover:bg-[#EAF6FF] text-[#008BC5] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer text-center flex flex-col justify-center items-center"
              >
                <span>Điền Admin</span>
                <span className="text-[12px] text-[#64748B] font-normal font-mono">ADMIN01</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('QL01', '12345678')}
                className="min-h-[48px] px-3 py-2 text-[14px] font-bold bg-[#F8FAFC] hover:bg-[#FEF9EE] text-[#B45309] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer text-center flex flex-col justify-center items-center"
              >
                <span>Điền Quản lý</span>
                <span className="text-[12px] text-[#64748B] font-normal font-mono">QL01</span>
              </button>
            </div>
          </div>
        )}

        {/* Nút quay lại trang công khai */}
        <div className="pt-2 border-t border-[#E2E8F0] text-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-[14px] font-semibold text-[#64748B] hover:text-[#008BC5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang dành cho đại biểu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}