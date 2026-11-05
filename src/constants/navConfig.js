import {
  LayoutDashboard,
  Users,
  GitFork,
  Database,
  Armchair,
  Layers,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { ROLES } from './roles.js';

export const ROLE_HEADERS = {
  [ROLES.ADMIN]: 'Quản trị hệ thống',
  [ROLES.MANAGER]: 'Quản lý hội trường',
};

export const ADMIN_NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
  },
  {
    to: '/admin/employees',
    label: 'Nhân viên',
    icon: Users,
  },
  {
    to: '/admin/org',
    label: 'Cơ cấu tổ chức',
    icon: GitFork,
  },
  {
    to: '/admin/maintenance',
    label: 'Bảo trì',
    icon: Database,
  },
];

export const MANAGER_NAV_ITEMS = [
  {
    to: '/manager/dashboard',
    label: 'Tổng quan',
    icon: LayoutDashboard,
  },
  {
    to: '/manager/seating',
    label: 'Sắp chỗ',
    icon: Armchair,
  },
  {
    to: '/manager/groups',
    label: 'Nhóm',
    icon: Layers,
  },
  {
    to: '/manager/attendance',
    label: 'Điểm danh',
    icon: UserCheck,
  },
  {
    to: '/manager/event',
    label: 'Sự kiện',
    icon: Calendar,
  },
];
