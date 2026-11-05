import { Block, Department, Employee, Group } from '../models/index.js';

export const orgController = {
  // =================== KHỐI (BLOCKS) ===================
  async getBlocks(req, res, next) {
    try {
      const blocks = await Block.find().sort({ createdAt: 1 });
      res.json(blocks);
    } catch (err) {
      next(err);
    }
  },

  async createBlock(req, res, next) {
    try {
      const { name } = req.body;
      const trimmed = (name || '').trim();
      if (!trimmed) return res.status(400).json({ message: 'Vui lòng nhập tên Khối.' });

      const newBlock = await Block.create({
        id: 'block-' + Date.now().toString(36),
        name: trimmed,
      });
      res.status(201).json(newBlock);
    } catch (err) {
      next(err);
    }
  },

  async updateBlock(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const trimmed = (name || '').trim();
      if (!trimmed) return res.status(400).json({ message: 'Vui lòng nhập tên Khối.' });

      const block = await Block.findOne({ id });
      if (!block) return res.status(404).json({ message: 'Không tìm thấy Khối cần cập nhật.' });

      block.name = trimmed;
      await block.save();
      res.json(block);
    } catch (err) {
      next(err);
    }
  },

  async deleteBlock(req, res, next) {
    try {
      const { id } = req.params;
      const block = await Block.findOne({ id });
      if (!block) return res.status(404).json({ message: 'Không tìm thấy Khối cần xóa.' });

      const employeeCount = await Employee.countDocuments({ blockId: id });
      if (employeeCount > 0) {
        return res.status(400).json({
          message: `"${block.name}" còn ${employeeCount} nhân viên, hãy chuyển họ sang Khối khác trước khi xóa.`,
        });
      }

      const deptsCount = await Department.countDocuments({ blockId: id });
      if (deptsCount > 0) {
        return res.status(400).json({
          message: `"${block.name}" đang là Khối mặc định của ${deptsCount} phòng ban. Vui lòng chuyển phòng ban sang Khối khác trước.`,
        });
      }

      const groupUsing = await Group.findOne({ blockIds: id });
      if (groupUsing) {
        return res.status(400).json({
          message: `"${block.name}" đang thuộc nhóm ghế "${groupUsing.name}". Hãy gỡ Khối khỏi nhóm ghế trước khi xóa.`,
        });
      }

      await Block.deleteOne({ id });
      res.json({ message: 'Đã xóa khối thành công.' });
    } catch (err) {
      next(err);
    }
  },

  // =================== PHÒNG BAN (DEPARTMENTS) ===================
  async getDepartments(req, res, next) {
    try {
      const departments = await Department.find().sort({ createdAt: 1 });
      res.json(departments);
    } catch (err) {
      next(err);
    }
  },

  async createDepartment(req, res, next) {
    try {
      const { name, blockId } = req.body;
      const trimmed = (name || '').trim();
      if (!trimmed) return res.status(400).json({ message: 'Vui lòng nhập tên Phòng ban / Phân xưởng.' });
      if (!blockId) return res.status(400).json({ message: 'Vui lòng chọn Khối mặc định cho phòng ban.' });

      const newDept = await Department.create({
        id: 'dept-' + Date.now().toString(36),
        name: trimmed,
        blockId,
      });
      res.status(201).json(newDept);
    } catch (err) {
      next(err);
    }
  },

  async updateDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const { name, blockId } = req.body;
      const trimmed = (name || '').trim();
      if (!trimmed) return res.status(400).json({ message: 'Vui lòng nhập tên Phòng ban / Phân xưởng.' });
      if (!blockId) return res.status(400).json({ message: 'Vui lòng chọn Khối mặc định.' });

      const dept = await Department.findOne({ id });
      if (!dept) return res.status(404).json({ message: 'Không tìm thấy phòng ban cần sửa.' });

      dept.name = trimmed;
      dept.blockId = blockId;
      await dept.save();
      res.json(dept);
    } catch (err) {
      next(err);
    }
  },

  async deleteDepartment(req, res, next) {
    try {
      const { id } = req.params;
      const dept = await Department.findOne({ id });
      if (!dept) return res.status(404).json({ message: 'Không tìm thấy phòng ban cần xóa.' });

      const employeeCount = await Employee.countDocuments({ departmentId: id });
      if (employeeCount > 0) {
        return res.status(400).json({
          message: `"${dept.name}" còn ${employeeCount} nhân viên, hãy chuyển họ sang phòng ban khác trước khi xóa.`,
        });
      }

      await Department.deleteOne({ id });
      res.json({ message: 'Đã xóa phòng ban thành công.' });
    } catch (err) {
      next(err);
    }
  },
};

