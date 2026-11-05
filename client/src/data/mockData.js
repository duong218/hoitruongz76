import { ROLES, GUEST_GROUP_ID } from '../constants/roles.js';
import { rowSeatIds, seatId, TOTAL_ROWS, SEATS_PER_SIDE } from '../constants/hall.js';

// Danh sách Khối (Blocks)
export const INITIAL_BLOCKS = [
  { id: 'block-agency', name: 'Khối cơ quan' },
  { id: 'block-workshop', name: 'Khối phân xưởng' },
  { id: 'block-lead', name: 'Khối lãnh đạo' },
  { id: 'block-support', name: 'Khối hỗ trợ' },
];

// Danh sách Phòng ban (Departments)
export const INITIAL_DEPARTMENTS = [
  { id: 'dept-plan', name: 'Phòng Kế hoạch', blockId: 'block-agency' },
  { id: 'dept-tech', name: 'Phòng Kỹ thuật', blockId: 'block-agency' },
  { id: 'dept-ws1', name: 'Phân xưởng 1', blockId: 'block-workshop' },
  { id: 'dept-ws2', name: 'Phân xưởng 2', blockId: 'block-workshop' },
  { id: 'dept-logistics', name: 'Phòng Hậu cần', blockId: 'block-support' },
];

// Danh sách Nhóm ghế (Groups)
export const INITIAL_GROUPS = [
  {
    id: 'group-lead',
    name: 'Trưởng ban và Cấp cao',
    color: '#F6AD37', // Vàng cam
    isSystem: false,
    checkInRequired: false,
    blockIds: ['block-lead'],
  },
  {
    id: 'group-agency',
    name: 'Khối cơ quan',
    color: '#E53E3E', // Đỏ
    isSystem: false,
    checkInRequired: true,
    blockIds: ['block-agency'],
  },
  {
    id: 'group-workshop',
    name: 'Khối phân xưởng',
    color: '#008BC5', // Xanh dương
    isSystem: false,
    checkInRequired: true,
    blockIds: ['block-workshop'],
  },
  {
    id: GUEST_GROUP_ID,
    name: 'Khách mời',
    color: '#475569', // Xám đậm
    isSystem: true,
    checkInRequired: false,
    blockIds: [],
  },
  {
    id: 'group-support',
    name: 'Khối hỗ trợ',
    color: '#0F766E', // Xanh ngọc
    isSystem: false,
    checkInRequired: true,
    blockIds: ['block-support'],
  },
];

// Danh sách Nhân viên mới (Employees)
export const INITIAL_EMPLOYEES = [
  {
    code: 'ADMIN01',
    name: 'Nguyễn Văn Quản Trị',
    role: ROLES.ADMIN,
    password: 'admin@123',
    departmentId: null,
    blockId: null,
  },
  {
    code: 'QL01',
    name: 'Trần Thị Quản Lý',
    role: ROLES.MANAGER,
    password: 'ql@12345',
    departmentId: null,
    blockId: null,
  },
  {
    code: 'NV001',
    name: 'Nguyễn Văn An',
    role: ROLES.EMPLOYEE,
    departmentId: 'dept-plan',
    blockId: 'block-agency',
  },
  {
    code: 'NV002',
    name: 'Trần Thị Bình',
    role: ROLES.EMPLOYEE,
    departmentId: 'dept-ws1',
    blockId: 'block-workshop',
  },
  {
    code: 'NV003',
    name: 'Lê Quang Cường',
    role: ROLES.EMPLOYEE,
    departmentId: 'dept-plan',
    blockId: 'block-lead',
  },
  {
    code: 'NV004',
    name: 'Phạm Thị Dung',
    role: ROLES.EMPLOYEE,
    departmentId: 'dept-tech',
    blockId: 'block-agency',
  },
  {
    code: 'NV005',
    name: 'Hoàng Văn Em',
    role: ROLES.EMPLOYEE,
    departmentId: 'dept-logistics',
    blockId: 'block-support',
  },
  {
    code: 'NV006',
    name: 'Vũ Thị Giang',
    role: ROLES.EMPLOYEE,
    departmentId: 'dept-ws2',
    blockId: 'block-workshop',
  },
];

// Tạo cấu hình ghế ban đầu
function createInitialSeatAssignments() {
  const assignments = {};

  // Hàng 1 và 2: Trưởng ban và Cấp cao (cả hàng)
  [1, 2].forEach((row) => {
    rowSeatIds(row).forEach((sId) => {
      assignments[sId] = 'group-lead';
    });
  });

  // Hàng 3 và 5: Khối cơ quan (cả hàng)
  [3, 5].forEach((row) => {
    rowSeatIds(row).forEach((sId) => {
      assignments[sId] = 'group-agency';
    });
  });

  // Hàng 8: Bên trái ghế 6 đến 10 thuộc Khối cơ quan
  for (let n = 6; n <= 10; n++) {
    assignments[seatId(8, 'L', n)] = 'group-agency';
  }

  // Hàng 4, 6, 7: Khối phân xưởng (cả hàng)
  [4, 6, 7].forEach((row) => {
    rowSeatIds(row).forEach((sId) => {
      assignments[sId] = 'group-workshop';
    });
  });

  // Hàng 9: Khách mời (cả hàng)
  rowSeatIds(9).forEach((sId) => {
    assignments[sId] = GUEST_GROUP_ID;
  });

  // Khối hỗ trợ: 0 ghế (để test nhóm chưa có chỗ)
  return assignments;
}

export const INITIAL_SEAT_GROUPS = createInitialSeatAssignments();

// Sinh token ngẫu nhiên 6 ký tự ổn định cho 200 ghế
export function generateInitialSeatTokens() {
  const tokens = {};
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let row = 1; row <= TOTAL_ROWS; row++) {
    ['L', 'R'].forEach((side) => {
      for (let n = 1; n <= SEATS_PER_SIDE; n++) {
        const sId = seatId(row, side, n);
        // Sinh chuỗi 6 ký tự giả ngẫu nhiên có hash ổn định
        let seed = (row * 37 + (side === 'L' ? 19 : 71) + n * 13) % 10007;
        let token = '';
        for (let i = 0; i < 6; i++) {
          seed = (seed * 9301 + 49297) % 233280;
          token += alphabet[Math.floor((seed / 233280) * alphabet.length)];
        }
        tokens[sId] = token;
      }
    });
  }
  return tokens;
}

export const INITIAL_SEAT_TOKENS = generateInitialSeatTokens();

export const INITIAL_EVENT = {
  eventName: 'Hội nghị Triển khai Nhiệm vụ Z176',
  guestEnabled: true,
  checkInOpen: true, // Mặc định mở điểm danh
  appUrl: '',
  seatTokens: INITIAL_SEAT_TOKENS,
};

// Dữ liệu điểm danh mẫu ban đầu
function createInitialAttendance() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  return [
    {
      employeeCode: 'NV001',
      seatId: '5-L-3',
      checkedInAt: `${yyyy}-${mm}-${dd}T08:05:00.000Z`,
    },
    {
      employeeCode: 'NV006',
      seatId: '6-R-4',
      checkedInAt: `${yyyy}-${mm}-${dd}T08:12:00.000Z`,
    },
  ];
}

export const INITIAL_ATTENDANCE = createInitialAttendance();
