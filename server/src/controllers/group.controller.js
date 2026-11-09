import { Group, Employee, Seat } from '../models/index.js';
import { ROLES, GUEST_GROUP_ID } from '../constants/roles.server.js';
import { audit } from '../utils/audit.js';
import { invalidateCachedGroups } from '../utils/memoryCache.js';

export const groupController = {
  // Lấy danh sách nhóm
  async getAll(req, res, next) {
    try {
      const groups = await Group.find().sort({ createdAt: 1 });
      res.json(groups);
    } catch (err) {
      next(err);
    }
  },

  // Thống kê sử dụng của nhóm (số người & số ghế)
  async getUsage(req, res, next) {
    try {
      const { id } = req.params;
      const group = await Group.findOne({ id });
      if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm.' });

      let employeeCount = 0;
      if (group.id === GUEST_GROUP_ID || group.isSystem) {
        employeeCount = await Employee.countDocuments({ role: ROLES.GUEST });
      } else if (Array.isArray(group.blockIds) && group.blockIds.length > 0) {
        employeeCount = await Employee.countDocuments({ blockId: { $in: group.blockIds } });
      }

      const seatCount = await Seat.countDocuments({ groupId: id });
      res.json({ employeeCount, seatCount });
    } catch (err) {
      next(err);
    }
  },

  // Thêm nhóm mới
  async create(req, res, next) {
    try {
      const { name, color, checkInRequired = true, blockIds = [] } = req.body;
      const trimmedName = (name || '').trim();
      if (!trimmedName) return res.status(400).json({ message: 'Vui lòng nhập tên nhóm.' });
      if (!color) return res.status(400).json({ message: 'Vui lòng chọn màu cho nhóm.' });

      const newGroup = await Group.create({
        id: 'group-' + Date.now().toString(36),
        name: trimmedName,
        color,
        isSystem: false,
        checkInRequired: checkInRequired !== undefined ? checkInRequired : true,
        blockIds: Array.isArray(blockIds) ? blockIds : [],
      });

      await audit(req, 'group.create', `Tạo nhóm "${trimmedName}" (${newGroup.id})`);
      invalidateCachedGroups();
      res.status(201).json(newGroup);
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật nhóm
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, color, checkInRequired, blockIds } = req.body;

      const group = await Group.findOne({ id });
      if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm cần cập nhật.' });

      if (!group.isSystem) {
        if (name) group.name = name.trim();
        if (checkInRequired !== undefined) group.checkInRequired = checkInRequired;
        if (blockIds !== undefined) group.blockIds = blockIds;
      }
      if (color) group.color = color;

      await group.save();
      await audit(req, 'group.update', `Sửa nhóm "${group.name}" (${id})`);
      invalidateCachedGroups();
      res.json(group);
    } catch (err) {
      next(err);
    }
  },

  // Xóa nhóm
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const group = await Group.findOne({ id });
      if (!group) return res.status(404).json({ message: 'Không tìm thấy nhóm cần xóa.' });
      if (group.isSystem || group.id === GUEST_GROUP_ID) {
        return res.status(400).json({ message: 'Không thể xóa nhóm hệ thống Khách mời.' });
      }

      await Group.deleteOne({ id });
      await Seat.updateMany({ groupId: id }, { $set: { groupId: null } });
      await audit(req, 'group.delete', `Xóa nhóm "${group.name}" (${id})`);
      invalidateCachedGroups();

      res.json({ message: 'Đã xóa nhóm thành công.' });
    } catch (err) {
      next(err);
    }
  },
};

