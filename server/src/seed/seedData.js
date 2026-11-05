// Dữ liệu mẫu, lấy theo client/src/data/mockData.js
// Hàm thuần (không đụng database) để dễ kiểm tra.
import { ROLES, GUEST_GROUP_ID } from '../constants/roles.server.js';
import { rowSeatIds, seatId, allSeatIds } from '../constants/hall.server.js';
import { generateSeatToken } from '../utils/seatToken.js';

export const BLOCKS = [
  { id: 'block-agency', name: 'Khối cơ quan' },
  { id: 'block-workshop', name: 'Khối phân xưởng' },
  { id: 'block-lead', name: 'Khối lãnh đạo' },
  { id: 'block-support', name: 'Khối hỗ trợ' },
];

export const DEPARTMENTS = [
  { id: 'dept-plan', name: 'Phòng Kế hoạch', blockId: 'block-agency' },
  { id: 'dept-tech', name: 'Phòng Kỹ thuật', blockId: 'block-agency' },
  { id: 'dept-ws1', name: 'Phân xưởng 1', blockId: 'block-workshop' },
  { id: 'dept-ws2', name: 'Phân xưởng 2', blockId: 'block-workshop' },
  { id: 'dept-logistics', name: 'Phòng Hậu cần', blockId: 'block-support' },
];

export const GROUPS = [
  { id: 'group-lead', name: 'Trưởng ban và Cấp cao', color: '#F6AD37', isSystem: false, checkInRequired: false, blockIds: ['block-lead'] },
  { id: 'group-agency', name: 'Khối cơ quan', color: '#E53E3E', isSystem: false, checkInRequired: true, blockIds: ['block-agency'] },
  { id: 'group-workshop', name: 'Khối phân xưởng', color: '#008BC5', isSystem: false, checkInRequired: true, blockIds: ['block-workshop'] },
  { id: GUEST_GROUP_ID, name: 'Khách mời', color: '#475569', isSystem: true, checkInRequired: false, blockIds: [] },
  { id: 'group-support', name: 'Khối hỗ trợ', color: '#0F766E', isSystem: false, checkInRequired: true, blockIds: ['block-support'] },
];

// Mật khẩu KHÔNG nằm trong code: truyền vào từ .env khi chạy seed
export function buildEmployees({ adminPasswordHash, managerPasswordHash }) {
  return [
    { code: 'ADMIN01', name: 'Nguyễn Văn Quản Trị', role: ROLES.ADMIN, passwordHash: adminPasswordHash, departmentId: null, blockId: null },
    { code: 'QL01', name: 'Trần Thị Quản Lý', role: ROLES.MANAGER, passwordHash: managerPasswordHash, departmentId: null, blockId: null },
    { code: 'NV001', name: 'Nguyễn Văn An', role: ROLES.EMPLOYEE, departmentId: 'dept-plan', blockId: 'block-agency' },
    { code: 'NV002', name: 'Trần Thị Bình', role: ROLES.EMPLOYEE, departmentId: 'dept-ws1', blockId: 'block-workshop' },
    { code: 'NV003', name: 'Lê Quang Cường', role: ROLES.EMPLOYEE, departmentId: 'dept-plan', blockId: 'block-lead' },
    { code: 'NV004', name: 'Phạm Thị Dung', role: ROLES.EMPLOYEE, departmentId: 'dept-tech', blockId: 'block-agency' },
    { code: 'NV005', name: 'Hoàng Văn Em', role: ROLES.EMPLOYEE, departmentId: 'dept-logistics', blockId: 'block-support' },
    { code: 'NV006', name: 'Vũ Thị Giang', role: ROLES.EMPLOYEE, departmentId: 'dept-ws2', blockId: 'block-workshop' },
  ];
}

// Bản đồ ghế -> nhóm, giống createInitialSeatAssignments() ở client
function buildSeatAssignments() {
  const a = {};
  [1, 2].forEach((r) => rowSeatIds(r).forEach((id) => (a[id] = 'group-lead')));
  [3, 5].forEach((r) => rowSeatIds(r).forEach((id) => (a[id] = 'group-agency')));
  for (let n = 6; n <= 10; n++) a[seatId(8, 'L', n)] = 'group-agency';
  [4, 6, 7].forEach((r) => rowSeatIds(r).forEach((id) => (a[id] = 'group-workshop')));
  rowSeatIds(9).forEach((id) => (a[id] = GUEST_GROUP_ID));
  return a; // Khối hỗ trợ: 0 ghế (để thử nhóm chưa có chỗ)
}

// Đủ 200 ghế; ghế chưa gán có groupId = null; mỗi ghế một token ngẫu nhiên
export function buildSeats() {
  const assignments = buildSeatAssignments();
  return allSeatIds().map((id) => ({
    seatId: id,
    groupId: assignments[id] || null,
    token: generateSeatToken(),
  }));
}

export const EVENT = {
  key: 'main',
  eventName: 'Hội nghị Triển khai Nhiệm vụ Z176',
  guestEnabled: true,
  checkInOpen: true,
  appUrl: 'http://localhost:3000/login',
};
