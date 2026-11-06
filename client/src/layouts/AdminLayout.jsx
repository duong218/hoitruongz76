import React, { useState, useEffect } from 'react';
import { Logo } from '../components/ui/Logo.jsx';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../constants/roles.js';
import {
  ROLE_HEADERS,
  ADMIN_NAV_ITEMS,
  MANAGER_NAV_ITEMS,
} from '../constants/navConfig.js';
import {
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const SIDEBAR_COLLAPSED_KEY = 'z176_sidebar_collapsed';

export function AdminLayout() {
  const { staff, logoutStaff } = useAuth();
  const navigate = useNavigate();

  const currentStaff = staff;
  const isAdmin = currentStaff?.role === ROLES.ADMIN;
  const headerTitle = ROLE_HEADERS[currentStaff?.role] || (isAdmin ? 'Quản trị hệ thống' : 'Quản lý hội trường');
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : MANAGER_NAV_ITEMS;

  // Trạng thái thu gọn sidebar (lưu vào localStorage để nhớ tùy chọn của người dùng)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const handleLogout = async () => {
    await logoutStaff();
    navigate('/quan-tri/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col text-[#0F172A]">
      {/* Header 64px / 72px */}
      <header className="h-16 lg:h-[72px] bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Nút toggle thu gọn/mở rộng sidebar trên desktop */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? 'Mở rộng menu (Ctrl/Click)' : 'Thu gọn menu để mở rộng không gian'}
            className="hidden lg:flex min-w-[40px] min-h-[40px] items-center justify-center text-[#64748B] hover:text-[#008BC5] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer border border-[#E2E8F0]"
            aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-[#008BC5]" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          <Logo className="w-9 h-9" />
          <div>
            <span className="font-bold text-[18px] text-[#0F172A] block leading-tight">
              {headerTitle}
            </span>
            <span className="text-[13px] text-[#64748B] hidden sm:block">
              Hệ thống Hội trường Z176
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[15px] font-bold text-[#0F172A] leading-tight">
              {currentStaff?.name}
            </span>
            <span className="block text-[13px] text-[#008BC5] font-semibold">
              {ROLE_LABELS[currentStaff?.role] || currentStaff?.role}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[44px] min-w-[44px] px-3 py-2 flex items-center gap-2 text-[15px] font-medium text-[#334155] hover:text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg transition-colors cursor-pointer border border-[#E2E8F0]"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-5 h-5 text-[#E53E3E]" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Main Container - full width để nội dung luôn bung đều, không bị lệch hoặc chừa khoảng trống lớn */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (>= 1024px) */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#E2E8F0] min-h-[calc(100vh-72px)] shrink-0 transition-all duration-300 ease-in-out sticky top-[72px] self-start max-h-[calc(100vh-72px)] ${
            collapsed ? 'w-[72px] p-2' : 'w-64 p-4'
          }`}
        >
          {/* Header nhóm danh mục */}
          <div className={`pb-3 mb-2 border-b border-[#E2E8F0] flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
            {!collapsed ? (
              <p className="text-[12px] font-extrabold text-[#64748B] uppercase tracking-wider">
                {isAdmin ? 'Danh mục quản trị' : 'Vận hành sự kiện'}
              </p>
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#008BC5]" title={isAdmin ? 'Quản trị' : 'Vận hành'} />
            )}
          </div>

          {/* Nav items */}
          <nav className="space-y-1 flex-1 overflow-y-auto pr-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 transition-colors rounded-xl min-h-[48px] ${
                      collapsed ? 'justify-center px-0' : 'px-3.5 py-3'
                    } ${
                      isActive
                        ? 'bg-[#EAF6FF] text-[#008BC5] font-bold shadow-xs'
                        : 'text-[#334155] hover:bg-[#F6F8FA] hover:text-[#0F172A]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-[15px] truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick link & Nút thu gọn ở chân Sidebar */}
          <div className="pt-3 mt-auto border-t border-[#E2E8F0] space-y-1">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? 'Xem trang Người quét' : undefined}
              className={`flex items-center gap-2.5 text-[14px] font-medium text-[#64748B] hover:text-[#008BC5] hover:bg-[#EAF6FF] rounded-xl transition-colors min-h-[44px] ${
                collapsed ? 'justify-center px-0' : 'px-3 py-2'
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Xem trang Người quét</span>}
            </a>

            {/* Nút thu nhỏ/mở rộng dưới chân sidebar */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
              className={`w-full flex items-center gap-2.5 text-[13px] font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors min-h-[40px] cursor-pointer ${
                collapsed ? 'justify-center px-0' : 'px-3 py-2'
              }`}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-[#008BC5]" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Thu gọn menu</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-w-0 max-w-full overflow-hidden transition-all duration-300">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (< 1024px) */}
      <nav
        aria-label="Điều hướng dưới cùng"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-1px_3px_rgba(15,23,42,0.08)] z-40 pb-[env(safe-area-inset-bottom,8px)]"
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[44px] transition-colors ${
                    isActive ? 'text-[#008BC5] font-bold' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-[12px] mt-1 leading-none">{item.shortLabel || item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
