import React, { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo.jsx';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut } from 'lucide-react';

const FONT_SCALES = [
  { value: 1, label: 'A', aria: 'Cỡ chữ thường' },
  { value: 1.15, label: 'A+', aria: 'Cỡ chữ lớn' },
  { value: 1.3, label: 'A++', aria: 'Cỡ chữ rất lớn' },
];
const FONT_SCALE_KEY = 'z176_font_scale';

function readFontScale() {
  try {
    const v = Number(localStorage.getItem(FONT_SCALE_KEY));
    return FONT_SCALES.some((f) => f.value === v) ? v : 1;
  } catch {
    return 1;
  }
}

export function AttendeeLayout() {
  const { attendee, logoutAttendee } = useAuth();
  const navigate = useNavigate();
  const [fontScale, setFontScale] = useState(readFontScale);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
    } catch {
      /* bỏ qua, dùng mặc định */
    }
  }, [fontScale]);

  const handleLogout = async () => {
    await logoutAttendee();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-between text-[#0F172A]">
      {/* Top bar if attendee is authenticated */}
      {attendee && (
        <header className="bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Logo className="w-8 h-8" />
              <span className="font-bold text-[16px] text-[#0F172A] hidden sm:inline">
                Sơ đồ hội trường Z176
              </span>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="text-right min-w-0">
                <span className="block truncate text-[14px] font-bold text-[#0F172A] leading-tight">
                  {attendee.name}
                </span>
                <span className="block truncate text-[14px] leading-5 text-[#334155]">
                  {attendee.groupName || 'Khách mời'}
                </span>
              </div>
              <div role="group" aria-label="Cỡ chữ" className="flex items-center gap-1 shrink-0">
                {FONT_SCALES.map((f) => {
                  const active = fontScale === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      aria-label={f.aria}
                      aria-pressed={active}
                      onClick={() => setFontScale(f.value)}
                      className={`min-h-[44px] min-w-[44px] px-1 rounded-lg border text-[16px] font-bold cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#008BC5] border-[#008BC5] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-[#F6F8FA]'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 min-h-[44px] min-w-[44px] px-2 flex flex-col items-center justify-center text-[14px] leading-4 font-medium text-[#334155] hover:text-[#C53030] hover:bg-[#FEECEC] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Thoát</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main
        style={{ zoom: fontScale }}
        className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 pb-[env(safe-area-inset-bottom,24px)] flex flex-col"
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-[14px] leading-5 text-[#334155] border-t border-[#E2E8F0] bg-white">
        Hệ thống Định hướng Chỗ ngồi Hội trường Z1Nhà máy Z176-76 • Doanh nghiệp Bộ Quốc Phòng • Phát triển, thiết kế bởi Phạm Ngọc Dương
      </footer>
    </div>
  );
}