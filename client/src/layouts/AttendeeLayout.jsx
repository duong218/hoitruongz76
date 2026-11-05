import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogOut } from 'lucide-react';

export function AttendeeLayout() {
  const { attendee, logoutAttendee } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAttendee();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col justify-between text-[#0F172A]">
      {/* Top bar if attendee is authenticated */}
      {attendee && (
        <header className="bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#008BC5] flex items-center justify-center text-white font-bold text-[14px]">
                Z176
              </div>
              <span className="font-bold text-[16px] text-[#0F172A] hidden sm:inline">
                Sơ đồ hội trường Z176
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-[14px] font-bold text-[#0F172A] leading-tight">
                  {attendee.name}
                </span>
                <span className="block text-[12px] text-[#64748B]">
                  {attendee.groupName || 'Khách mời'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#64748B] hover:text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 pb-[env(safe-area-inset-bottom,24px)] flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-[14px] leading-5 text-[#334155] border-t border-[#E2E8F0] bg-white">
        Hệ thống Định hướng Chỗ ngồi Hội trường Z176 • Doanh nghiệp Bộ Quốc Phòng
      </footer>
    </div>
  );
}