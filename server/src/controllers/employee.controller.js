import bcrypt from 'bcryptjs';
import { Employee } from '../models/index.js';
import { ROLES } from '../constants/roles.server.js';
import { audit } from '../utils/audit.js';

export const employeeController = {
  // Lấy danh sách nhân viên
  async getAll(req, res, next) {
    try {
      const employees = await Employee.find().sort({ code: 1 });
      res.json(employees);
    } catch (err) {
      next(err);
    }
  },

  // Thêm nhân viên
  async create(req, res, next) {
    try {
      const { code, name, role, departmentId, blockId, password } = req.body;
      const trimmedCode = (code || '').trim().toUpperCase();
      const trimmedName = (name || '').trim();

      if (!trimmedCode) return res.status(400).json({ message: 'Vui lòng nhập mã nhân viên.' });
      if (!trimmedName) return res.status(400).json({ message: 'Vui lòng nhập họ và tên nhân viên.' });

      const exists = await Employee.findOne({ code: trimmedCode });
      if (exists) {
        return res.status(409).json({ message: `Mã nhân viên "${trimmedCode}" đã tồn tại trên hệ thống.` });
      }

      const assignedRole = role || ROLES.EMPLOYEE;
      const isStaff = assignedRole === ROLES.ADMIN || assignedRole === ROLES.MANAGER;

      let passwordHash = undefined;
      if (isStaff) {
        const trimmedPass = (password || '').trim();
        if (!trimmedPass || trimmedPass.length < 8) {
          return res.status(400).json({ message: 'Mật khẩu quản trị phải có tối thiểu 8 ký tự.' });
        }
        passwordHash = await bcrypt.hash(trimmedPass, 10);
      }

      const newEmp = await Employee.create({
        code: trimmedCode,
        name: trimmedName,
        role: assignedRole,
        departmentId: departmentId || null,
        blockId: blockId || null,
        passwordHash,
      });

      await audit(req, 'employee.create', `Thêm ${trimmedCode} (${assignedRole})`);
      res.status(201).json(newEmp);
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật nhân viên
  async update(req, res, next) {
    try {
      const code = req.params.code.trim().toUpperCase();
      const { name, role, departmentId, blockId, password } = req.body;

      const emp = await Employee.findOne({ code }).select('+passwordHash');
      if (!emp) return res.status(404).json({ message: 'Không tìm thấy nhân viên cần cập nhật.' });

      if (name) emp.name = name.trim();
      if (role) emp.role = role;
      if (departmentId !== undefined) emp.departmentId = departmentId || null;
      if (blockId !== undefined) emp.blockId = blockId || null;

      let passwordChanged = false;
      const isStaff = emp.role === ROLES.ADMIN || emp.role === ROLES.MANAGER;
      if (isStaff) {
        if (password && password.trim()) {
          const trimmedPass = password.trim();
          if (trimmedPass.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu quản trị phải có tối thiểu 8 ký tự.' });
          }
          emp.passwordHash = await bcrypt.hash(trimmedPass, 10);
          emp.passwordChangedAt = new Date();
          passwordChanged = true;
        } else if (!emp.passwordHash) {
          return res.status(400).json({ message: 'Tài khoản quản trị bắt buộc phải có mật khẩu (tối thiểu 8 ký tự).' });
        }
      } else {
        emp.passwordHash = undefined;
      }

      await emp.save();
      // Chỉ ghi TÊN các trường đã đổi, không ghi mật khẩu
      const changed = [];
      if (name) changed.push('tên');
      if (role) changed.push(`vai trò=${role}`);
      if (departmentId !== undefined) changed.push('phòng ban');
      if (blockId !== undefined) changed.push('khối');
      if (passwordChanged) changed.push('mật khẩu');
      await audit(req, 'employee.update', `Sửa ${code}: ${changed.join(', ') || 'không đổi gì'}`);
      res.json(emp);
    } catch (err) {
      next(err);
    }
  },

  // Xóa nhân viên
  async delete(req, res, next) {
    try {
      const code = req.params.code.trim().toUpperCase();
      const result = await Employee.findOneAndDelete({ code });
      if (!result) return res.status(404).json({ message: 'Không tìm thấy nhân viên để xóa.' });
      await audit(req, 'employee.delete', `Xóa ${code}`);
      res.json({ message: 'Đã xóa nhân viên thành công.' });
    } catch (err) {
      next(err);
    }
  },

  // Import từ Excel
  async importEmployees(req, res, next) {
    try {
      const validRows = req.body.rows || [];
      if (!Array.isArray(validRows) || validRows.length === 0) {
        return res.status(400).json({ message: 'Dữ liệu danh sách import không hợp lệ.' });
      }

      const bulkOps = validRows.map((row) => ({
        updateOne: {
          filter: { code: row.code.trim().toUpperCase() },
          update: {
            $set: {
              name: row.name.trim(),
              role: row.role || ROLES.EMPLOYEE,
              departmentId: row.departmentId || null,
              blockId: row.blockId || null,
            },
          },
          upsert: true,
        },
      }));

      await Employee.bulkWrite(bulkOps);
      const staffRows = validRows.filter((r) => r.role === ROLES.ADMIN || r.role === ROLES.MANAGER).length;
      await audit(req, 'employee.import', `Nhập ${validRows.length} dòng${staffRows ? `, trong đó ${staffRows} dòng có vai trò quản trị` : ''}`);
      res.json({ importedCount: validRows.length });
    } catch (err) {
      next(err);
    }
  },
};

