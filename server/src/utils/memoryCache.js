import { Group, EventSetting } from '../models/index.js';

// Bộ nhớ đệm trong RAM cho Group và EventSetting
// Giảm tải truy vấn MongoDB khi hàng trăm người cùng quét QR điểm danh
let cachedGroups = null;
let cachedGroupsTime = 0;

let cachedEvent = null;
let cachedEventTime = 0;

const CACHE_TTL_MS = 15000; // 15 giây

/**
 * Lấy danh sách Group từ cache RAM (tự làm mới sau 15 giây nếu hết hạn)
 */
export async function getCachedGroups() {
  const now = Date.now();
  if (cachedGroups && now - cachedGroupsTime < CACHE_TTL_MS) {
    return cachedGroups;
  }
  const groups = await Group.find();
  cachedGroups = groups;
  cachedGroupsTime = now;
  return groups;
}

/**
 * Xóa cache Groups khi Admin/Manager thêm, sửa, xóa nhóm
 */
export function invalidateCachedGroups() {
  cachedGroups = null;
  cachedGroupsTime = 0;
}

/**
 * Lấy EventSetting từ cache RAM (tự làm mới sau 15 giây nếu hết hạn)
 */
export async function getCachedEvent() {
  const now = Date.now();
  if (cachedEvent && now - cachedEventTime < CACHE_TTL_MS) {
    return cachedEvent;
  }
  const event = await EventSetting.findOne({ key: 'main' });
  cachedEvent = event;
  cachedEventTime = now;
  return event;
}

/**
 * Xóa cache Event khi có cập nhật cài đặt sự kiện hoặc đổi trạng thái điểm danh
 */
export function invalidateCachedEvent() {
  cachedEvent = null;
  cachedEventTime = 0;
}

