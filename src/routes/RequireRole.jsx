import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../constants/roles.js';

/**
 * Component bảo vệ tuyến đường theo danh sách quyền (roles)
 * Phân định rạch ròi phiên staff (/admin, /manager) và phiên attendee (/seat, /checkin)
 * @param {{ allowedRoles: string[], children: React.ReactNode }} props
 */
export function RequireRole({ allowedRoles = [], children }) {
  const { attendee, staff, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FA]">
        <div className="flex items-center gap-3 text-[#334155]">
          <div className="w-5 h-5 border-2 border-[#008BC5] border-t-transparent rounded-full animate-spin" />
          <span className="text-[16px] font-medium">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  const isStaffRoute =
    allowedRoles.includes(ROLES.ADMIN) || allowedRoles.includes(ROLES.MANAGER);

  // 1. TUYẾN ĐƯỜNG QUẢN TRỊ (/admin/** hoặc /manager/**)
  if (isStaffRoute) {
    const currentPath = location.pathname + location.search;
    const loginTarget = `/quan-tri/login?next=${encodeURIComponent(currentPath)}`;

    // Chưa đăng nhập staff hoặc phiên staff đã hết hạn
    if (!staff) {
      return <Navigate to={loginTarget} replace />;
    }

    if (staff.expiresAt && Date.now() > staff.expiresAt) {
      return <Navigate to={loginTarget} replace />;
    }

    // Kiểm tra đúng vai trò được phép
    if (!allowedRoles.includes(staff.role)) {
      if (staff.role === ROLES.ADMIN) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (staff.role === ROLES.MANAGER) {
        return <Navigate to="/manager/dashboard" replace />;
      }
      return <Navigate to={loginTarget} replace />;
    }

    return children;
  }

  // 2. TUYẾN ĐƯỜNG NGƯỜI THAM DỰ (/seat, /checkin)
  const currentPath = location.pathname + location.search;
  const attendeeLoginTarget = `/login?next=${encodeURIComponent(currentPath)}`;

  if (!attendee) {
    return <Navigate to={attendeeLoginTarget} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(attendee.role)) {
    return <Navigate to={attendeeLoginTarget} replace />;
  }

  return children;
}
