import React, { useState } from 'react';
import { Logo } from '../components/ui/Logo.jsx';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../constants/roles.js';
import {
  ROLE_HEADERS,
  ADMIN_NAV_ITEMS,
  MANAGER_NAV_ITEMS,
} from '../constants/navConfig.js';
import { LogOut, ExternalLink, ArrowLeftRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function AdminLayout() {
  const { staff, logoutStaff } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Thu gọn menu: nhớ lựa chọn trên trình duyệt này (lỗi đọc/ghi thì bỏ qua)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('z176_nav_collapsed') === '1'; } catch { return false; }
  });
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem('z176_nav_collapsed', c ? '0' : '1'); } catch { /* bỏ qua */ }
      return !c;
    });
  };

  const currentStaff = staff;
  const isAdmin = currentStaff?.role === ROLES.ADMIN;
  const headerTitle = ROLE_HEADERS[currentStaff?.role] || (isAdmin ? 'Quản trị hệ thống' : 'Quản lý hội trường');
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : MANAGER_NAV_ITEMS;

  const handleLogout = async () => {
    await logoutStaff();
    navigate('/quan-tri/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex flex-col text-[#0F172A]">
      {/* Header 64px / 72px */}
      <header className="h-16 lg:h-[72px] bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.08)] sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
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

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className={`hidden lg:block ${collapsed ? 'w-[76px]' : 'w-64'} transition-[width] duration-200 bg-white border-r border-[#E2E8F0] min-h-[calc(100vh-72px)] p-4 space-y-1 shrink-0`}>
          <div className={`pb-3 mb-2 border-b border-[#E2E8F0] flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <p className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider px-3">
                {isAdmin ? 'Danh mục quản trị' : 'Vận hành sự kiện'}
              </p>
            )}
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#334155] hover:bg-[#F6F8FA] cursor-pointer"
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  style={{ '--stagger-delay': `${i * 130}ms` }}
                  className={({ isActive }) =>
                    `fade-in-up flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-3 text-[16px] font-medium transition-colors rounded-r-lg min-h-[48px] ${
                      isActive
                        ? 'bg-[#EAF6FF] text-[#008BC5] font-semibold border-l-[3px] border-l-[#008BC5]'
                        : 'text-[#334155] hover:bg-[#F6F8FA] border-l-[3px] border-l-transparent'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick link to view attendee page */}
          <div className="pt-6 mt-6 border-t border-[#E2E8F0]">
            <a
              href="/login"
              target="_blank"
              rel="noopener noreferrer"
              title="Xem trang Người quét"
              className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} gap-2 py-3 text-[15px] font-medium text-[#64748B] hover:text-[#008BC5] hover:bg-[#EAF6FF] rounded-lg transition-colors min-h-[48px]`}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Xem trang Người quét</span>}
            </a>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-full overflow-hidden">
          {/* key theo đường dẫn: đổi trang thì các khối hiện dần lại từ trên xuống */}
          <div key={pathname} className="reveal-stack">
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