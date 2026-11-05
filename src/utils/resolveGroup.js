import { GUEST_GROUP_ID, ROLES } from '../constants/roles.js';

/**
 * Xác định nhóm ghế của nhân viên hoặc khách mời dựa theo KHỐI (blockId)
 * @param {object | null} employee - { code, name, role, blockId, isGuest }
 * @param {Array<object>} groups - Danh sách các nhóm [{ id, name, blockIds, isSystem, ... }]
 * @returns {object | null} Nhóm tương ứng hoặc null nếu chưa có nhóm
 */
export function resolveGroup(employee, groups = []) {
  if (!employee) return null;

  // Khách mời luôn thuộc nhóm hệ thống Khách mời
  if (
    employee.role === ROLES.GUEST ||
    employee.isGuest ||
    employee.code?.startsWith('GUEST_')
  ) {
    const guestGroup = groups.find((g) => g.id === GUEST_GROUP_ID || g.isSystem);
    if (guestGroup) return guestGroup;
    return {
      id: GUEST_GROUP_ID,
      name: 'Khách mời',
      color: '#475569',
      isSystem: true,
      checkInRequired: false,
      blockIds: [],
    };
  }

  // Nếu nhân viên không có khối
  if (!employee.blockId) {
    return null;
  }

  // Tìm nhóm có blockIds chứa employee.blockId
  const matched = groups.find(
    (g) => Array.isArray(g.blockIds) && g.blockIds.includes(employee.blockId)
  );

  return matched || null;
}
