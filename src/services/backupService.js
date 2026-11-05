import {
  INITIAL_BLOCKS,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_GROUPS,
  INITIAL_SEAT_GROUPS,
  INITIAL_EVENT,
  INITIAL_ATTENDANCE,
} from '../data/mockData.js';

const KEYS = {
  blocks: 'z176_v2_blocks',
  departments: 'z176_v2_departments',
  employees: 'z176_v2_employees',
  groups: 'z176_v2_groups',
  seats: 'z176_v2_seats',
  event: 'z176_v2_event',
  attendance: 'z176_v2_attendance',
};

export const backupService = {
  /**
   * Xuất toàn bộ dữ liệu ra file JSON
   */
  exportBackup() {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      data: {
        blocks: JSON.parse(localStorage.getItem(KEYS.blocks) || '[]'),
        departments: JSON.parse(localStorage.getItem(KEYS.departments) || '[]'),
        employees: JSON.parse(localStorage.getItem(KEYS.employees) || '[]'),
        groups: JSON.parse(localStorage.getItem(KEYS.groups) || '[]'),
        seats: JSON.parse(localStorage.getItem(KEYS.seats) || '{}'),
        event: JSON.parse(localStorage.getItem(KEYS.event) || '{}'),
        attendance: JSON.parse(localStorage.getItem(KEYS.attendance) || '[]'),
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `z176-sao-luu-${ymd}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Khôi phục dữ liệu từ nội dung file JSON
   * @param {string} jsonString
   */
  async restoreBackup(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Tệp không đúng định dạng JSON hợp lệ.');
    }

    if (!parsed || !parsed.data) {
      throw new Error('Cấu trúc file sao lưu không hợp lệ, thiếu mục dữ liệu chính.');
    }

    const { blocks, departments, employees, groups, seats, event, attendance } = parsed.data;

    if (!Array.isArray(blocks) || !Array.isArray(departments) || !Array.isArray(employees) || !Array.isArray(groups)) {
      throw new Error('Dữ liệu các bảng khối, phòng ban, nhân viên hoặc nhóm bị sai cấu trúc.');
    }

    localStorage.setItem(KEYS.blocks, JSON.stringify(blocks));
    localStorage.setItem(KEYS.departments, JSON.stringify(departments));
    localStorage.setItem(KEYS.employees, JSON.stringify(employees));
    localStorage.setItem(KEYS.groups, JSON.stringify(groups));
    if (seats) localStorage.setItem(KEYS.seats, JSON.stringify(seats));
    if (event) localStorage.setItem(KEYS.event, JSON.stringify(event));
    if (attendance) localStorage.setItem(KEYS.attendance, JSON.stringify(attendance));

    window.dispatchEvent(new Event('z176_data_reset'));
  },

  /**
   * Đặt lại toàn bộ về dữ liệu mẫu ban đầu
   */
  async resetToDemoData() {
    localStorage.setItem(KEYS.blocks, JSON.stringify(INITIAL_BLOCKS));
    localStorage.setItem(KEYS.departments, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(KEYS.employees, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(KEYS.groups, JSON.stringify(INITIAL_GROUPS));
    localStorage.setItem(KEYS.seats, JSON.stringify(INITIAL_SEAT_GROUPS));
    localStorage.setItem(KEYS.event, JSON.stringify(INITIAL_EVENT));
    localStorage.setItem(KEYS.attendance, JSON.stringify(INITIAL_ATTENDANCE));

    window.dispatchEvent(new Event('z176_data_reset'));
  },
};
