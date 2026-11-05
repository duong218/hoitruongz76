// MERN: thay bằng axios gọi /api/groups
import { INITIAL_GROUPS } from '../data/mockData.js';
import { GUEST_GROUP_ID } from '../constants/roles.js';
import { resolveGroup } from '../utils/resolveGroup.js';

const STORAGE_KEY_GROUPS = 'z176_v2_groups';
const STORAGE_KEY_SEATS = 'z176_v2_seats';
const STORAGE_KEY_EMPLOYEES = 'z176_v2_employees';

function getStoredGroups() {
  if (typeof localStorage === 'undefined') {
    return [...INITIAL_GROUPS];
  }
  const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(INITIAL_GROUPS));
    return [...INITIAL_GROUPS];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_GROUPS];
  }
}

function saveGroups(groups) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
  }
}

export const groupService = {
  async getGroups() {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return getStoredGroups();
  },

  async getGroupUsage(groupId) {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const groups = getStoredGroups();

    let employeeCount = 0;
    try {
      const emps = JSON.parse(localStorage.getItem(STORAGE_KEY_EMPLOYEES) || '[]');
      employeeCount = emps.filter((e) => {
        const g = resolveGroup(e, groups);
        return g && g.id === groupId;
      }).length;
    } catch {
      employeeCount = 0;
    }

    let seatCount = 0;
    try {
      const seats = JSON.parse(localStorage.getItem(STORAGE_KEY_SEATS) || '{}');
      seatCount = Object.values(seats).filter((gId) => gId === groupId).length;
    } catch {
      seatCount = 0;
    }

    return { employeeCount, seatCount };
  },

  async addGroup({ name, color, checkInRequired = true, blockIds = [] }) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Vui lòng nhập tên nhóm.');
    if (!color) throw new Error('Vui lòng chọn màu cho nhóm.');

    const groups = getStoredGroups();
    if (groups.some((g) => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('Tên nhóm này đã tồn tại. Vui lòng chọn tên khác.');
    }

    const newGroup = {
      id: 'group-' + Date.now().toString(36),
      name: trimmedName,
      color,
      isSystem: false,
      checkInRequired: checkInRequired !== undefined ? checkInRequired : true,
      blockIds: Array.isArray(blockIds) ? blockIds : [],
    };

    saveGroups([...groups, newGroup]);
    return newGroup;
  },

  async updateGroup(id, { name, color, checkInRequired, blockIds }) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const groups = getStoredGroups();
    const index = groups.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Không tìm thấy nhóm cần cập nhật.');

    const target = groups[index];
    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Vui lòng nhập tên nhóm.');
    if (!color) throw new Error('Vui lòng chọn màu cho nhóm.');

    const finalName = target.isSystem ? target.name : trimmedName;
    const finalCheckIn = target.isSystem ? false : (checkInRequired !== undefined ? checkInRequired : target.checkInRequired);
    const finalBlockIds = target.isSystem ? [] : (blockIds !== undefined ? blockIds : target.blockIds || []);

    const updatedGroup = {
      ...target,
      name: finalName,
      color,
      checkInRequired: finalCheckIn,
      blockIds: finalBlockIds,
    };

    groups[index] = updatedGroup;
    saveGroups(groups);
    return updatedGroup;
  },

  async deleteGroup(id) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const groups = getStoredGroups();
    const target = groups.find((g) => g.id === id);
    if (!target) throw new Error('Không tìm thấy nhóm cần xóa.');
    if (target.isSystem || target.id === GUEST_GROUP_ID) {
      throw new Error('Không thể xóa nhóm hệ thống Khách mời.');
    }

    // Xóa nhóm
    const remaining = groups.filter((g) => g.id !== id);
    saveGroups(remaining);

    // Bỏ gán ghế thuộc nhóm này
    try {
      const rawSeats = localStorage.getItem(STORAGE_KEY_SEATS);
      if (rawSeats) {
        const seats = JSON.parse(rawSeats);
        let changed = false;
        Object.keys(seats).forEach((seatId) => {
          if (seats[seatId] === id) {
            delete seats[seatId];
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEY_SEATS, JSON.stringify(seats));
        }
      }
    } catch {
      // Ignore seat cleanup error
    }
  },
};
