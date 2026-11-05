import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { attendeeService } from '../services/attendeeService.js';
import { staffAuthService } from '../services/staffAuthService.js';
import { groupService } from '../services/groupService.js';
import { resolveGroup } from '../utils/resolveGroup.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Phiên người tham dự (nhân viên / khách mời)
  const [attendee, setAttendee] = useState(null);
  const [attendeeGroup, setAttendeeGroup] = useState(null);

  // Phiên quản trị (Admin / Quản lý) có hạn 8 giờ
  const [staff, setStaff] = useState(null);

  const [loading, setLoading] = useState(true);

  // Tải cả hai phiên độc lập từ storage
  const refreshAuth = useCallback(async () => {
    try {
      const [storedAttendee, storedStaff] = await Promise.all([
        attendeeService.getAttendeeSession(),
        staffAuthService.getStaffSession(),
      ]);

      setAttendee((prev) => {
        if (!prev && !storedAttendee) return null;
        if (prev?.code === storedAttendee?.code && prev?.name === storedAttendee?.name) return prev;
        return storedAttendee;
      });

      setStaff((prev) => {
        if (!prev && !storedStaff) return null;
        if (prev?.code === storedStaff?.code && prev?.token === storedStaff?.token) return prev;
        return storedStaff;
      });

      if (storedAttendee) {
        try {
          const groups = await groupService.getGroups();
          const matched = resolveGroup(storedAttendee, groups);
          setAttendeeGroup((prev) => (prev?.id === matched?.id ? prev : matched));
        } catch {
          setAttendeeGroup(null);
        }
      } else {
        setAttendeeGroup(null);
      }
    } catch {
      setAttendee(null);
      setStaff(null);
      setAttendeeGroup(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    const handleReset = () => refreshAuth();
    const handleAttendeeChange = (e) => {
      setAttendee(e.detail || null);
    };
    const handleStaffChange = (e) => {
      setStaff(e.detail || null);
    };

    window.addEventListener('z176_data_reset', handleReset);
    window.addEventListener('z176_attendee_session_changed', handleAttendeeChange);
    window.addEventListener('z176_staff_session_changed', handleStaffChange);

    // Kiểm tra định kỳ hết hạn phiên staff 8 giờ.
    // Không đưa `staff` vào dependency: refreshAuth luôn parse object mới từ
    // localStorage, nếu effect phụ thuộc staff sẽ setState liên tục và đơ UI.
    const interval = setInterval(async () => {
      const currentStaff = await staffAuthService.getStaffSession();
      if (!currentStaff) {
        setStaff((prev) => (prev ? null : prev));
      }
    }, 30000);

    return () => {
      window.removeEventListener('z176_data_reset', handleReset);
      window.removeEventListener('z176_attendee_session_changed', handleAttendeeChange);
      window.removeEventListener('z176_staff_session_changed', handleStaffChange);
      clearInterval(interval);
    };
  }, []);

  // Đăng nhập người tham dự bằng mã nhân viên
  const loginWithCode = async (code) => {
    const result = await attendeeService.lookupByCode(code);
    if (result.ok) {
      setAttendee(result.user);
      setAttendeeGroup(result.group);
    }
    return result;
  };

  // Đăng nhập người tham dự với tư cách khách mời
  const loginAsGuest = async (fullName) => {
    const result = await attendeeService.enterAsGuest(fullName);
    if (result.ok) {
      setAttendee(result.user);
      setAttendeeGroup(result.group);
    }
    return result;
  };

  // Đăng nhập quản trị bằng mã + mật khẩu
  const loginStaff = async (code, password) => {
    const session = await staffAuthService.login(code, password);
    setStaff(session);
    return session;
  };

  // Đăng xuất phiên quản trị (chỉ xóa staff, giữ nguyên attendee)
  const logoutStaff = async () => {
    await staffAuthService.logout();
    setStaff(null);
  };

  // Đăng xuất phiên người tham dự (chỉ xóa attendee, giữ nguyên staff)
  const logoutAttendee = async () => {
    await attendeeService.logout();
    setAttendee(null);
    setAttendeeGroup(null);
  };

  // Đăng xuất chung (ưu tiên đăng xuất attendee nếu có, hoặc đăng xuất staff)
  const logout = async () => {
    await logoutAttendee();
  };

  return (
    <AuthContext.Provider
      value={{
        // 2 phiên riêng biệt
        attendee,
        staff,
        // Biến user tương thích ngược: ưu tiên staff nếu đang ở trang admin/manager, ngược lại là attendee
        user: attendee || staff,
        group: attendeeGroup,
        loading,
        loginWithCode,
        loginAsGuest,
        loginStaff,
        logoutStaff,
        logoutAttendee,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
