import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import { RequireRole } from './routes/RequireRole.jsx';
import { ROLES } from './constants/roles.js';

// Layouts
import { AttendeeLayout } from './layouts/AttendeeLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

// Attendee Pages
import { LoginPage } from './pages/attendee/LoginPage.jsx';
import { SeatPage } from './pages/attendee/SeatPage.jsx';
import { DirectCheckInPage } from './pages/attendee/DirectCheckInPage.jsx';

// Staff Auth Page
import { StaffLoginPage } from './pages/auth/StaffLoginPage.jsx';

// Admin Pages (Chỉ ADMIN)
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { EmployeesPage } from './pages/admin/EmployeesPage.jsx';
import { OrgPage } from './pages/admin/OrgPage.jsx';
import { MaintenancePage } from './pages/admin/MaintenancePage.jsx';

// Manager Pages (Chỉ MANAGER)
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage.jsx';
import { SeatingPage } from './pages/admin/SeatingPage.jsx';
import { GroupsPage } from './pages/admin/GroupsPage.jsx';
import { AttendancePage } from './pages/manager/AttendancePage.jsx';
import { ManagerEventPage } from './pages/manager/ManagerEventPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Routes>
              {/* Trang Đăng nhập quản trị riêng biệt */}
              <Route path="/quan-tri/login" element={<StaffLoginPage />} />
              <Route path="/quan-tri" element={<Navigate to="/quan-tri/login" replace />} />

              {/* Tuyến người tham dự & Quét mã */}
              <Route element={<AttendeeLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/seat"
                  element={
                    <RequireRole allowedRoles={[ROLES.EMPLOYEE, ROLES.GUEST]}>
                      <SeatPage />
                    </RequireRole>
                  }
                />
                <Route path="/checkin" element={<DirectCheckInPage />} />
              </Route>

              {/* Tuyến Quản trị viên (Chỉ ADMIN) */}
              <Route
                path="/admin"
                element={
                  <RequireRole allowedRoles={[ROLES.ADMIN]}>
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="org" element={<OrgPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="event" element={<Navigate to="/manager/event" replace />} />
                <Route path="qr" element={<Navigate to="/manager/event" replace />} />
              </Route>

              {/* Tuyến Quản lý vận hành (Chỉ MANAGER) */}
              <Route
                path="/manager"
                element={
                  <RequireRole allowedRoles={[ROLES.MANAGER]}>
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="dashboard" element={<ManagerDashboardPage />} />
                <Route path="seating" element={<SeatingPage />} />
                <Route path="groups" element={<GroupsPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="event" element={<ManagerEventPage />} />
              </Route>

              {/* Điều hướng mặc định */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
