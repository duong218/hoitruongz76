import bcrypt from 'bcryptjs';
import { Employee, Block, Department, EmployeeChangeLog } from '../models/index.js';
import { ROLES } from '../constants/roles.server.js';
import { audit } from '../utils/audit.js';

export const employeeController = {
  // Lấy danh sách nhân viên
  async getAll(req, res, next) {
    try {
      const employees = await Employee.findAll();
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

      const exists = await Employee.findByCode(trimmedCode);
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

      const emp = await Employee.findByCode(code, { includePasswordHash: true });
      if (!emp) return res.status(404).json({ message: 'Không tìm thấy nhân viên cần cập nhật.' });

      const updates = {};
      if (name) updates.name = name.trim();
      if (role) updates.role = role;
      if (departmentId !== undefined) updates.departmentId = departmentId || null;
      if (blockId !== undefined) updates.blockId = blockId || null;

      const targetRole = updates.role || emp.role;
      let passwordChanged = false;
      const isStaff = targetRole === ROLES.ADMIN || targetRole === ROLES.MANAGER;
      if (isStaff) {
        if (password && password.trim()) {
          const trimmedPass = password.trim();
          if (trimmedPass.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu quản trị phải có tối thiểu 8 ký tự.' });
          }
          updates.passwordHash = await bcrypt.hash(trimmedPass, 10);
          updates.passwordChangedAt = new Date();
          passwordChanged = true;
        } else if (!emp.passwordHash) {
          return res.status(400).json({ message: 'Tài khoản quản trị bắt buộc phải có mật khẩu (tối thiểu 8 ký tự).' });
        }
      } else {
        updates.passwordHash = null;
      }

      const updatedEmp = await Employee.updateByCode(code, updates);

      // Ghi nhận thay đổi Tên / Phòng ban / Khối để thông báo cho Quản lý ở trang Sắp chỗ
      const nameChanged = updates.name && updates.name !== emp.name;
      const deptChanged = updates.departmentId !== undefined && updates.departmentId !== emp.departmentId;
      const blockChanged = updates.blockId !== undefined && updates.blockId !== emp.blockId;
      if (nameChanged || deptChanged || blockChanged) {
        const [oldDeptDoc, newDeptDoc, oldBlockDoc, newBlockDoc] = await Promise.all([
          deptChanged && emp.departmentId ? Department.findById(emp.departmentId) : null,
          deptChanged && updates.departmentId ? Department.findById(updates.departmentId) : null,
          blockChanged && emp.blockId ? Block.findById(emp.blockId) : null,
          blockChanged && updates.blockId ? Block.findById(updates.blockId) : null,
        ]);
        await EmployeeChangeLog.create({
          employeeCode: code,
          oldName: nameChanged ? emp.name : null,
          newName: nameChanged ? updates.name : null,
          oldDept: deptChanged ? (oldDeptDoc?.name || 'Chưa có') : null,
          newDept: deptChanged ? (newDeptDoc?.name || 'Chưa có') : null,
          oldBlock: blockChanged ? (oldBlockDoc?.name || 'Chưa có') : null,
          newBlock: blockChanged ? (newBlockDoc?.name || 'Chưa có') : null,
        });
      }

      // Chỉ ghi TÊN các trường đã đổi, không ghi mật khẩu
      const changed = [];
      if (name) changed.push('tên');
      if (role) changed.push(`vai trò=${role}`);
      if (departmentId !== undefined) changed.push('phòng ban');
      if (blockId !== undefined) changed.push('khối');
      if (passwordChanged) changed.push('mật khẩu');
      await audit(req, 'employee.update', `Sửa ${code}: ${changed.join(', ') || 'không đổi gì'}`);
      res.json(updatedEmp);
    } catch (err) {
      next(err);
    }
  },

  // Xóa nhân viên
  async delete(req, res, next) {
    try {
      const code = req.params.code.trim().toUpperCase();
      const result = await Employee.deleteByCode(code);
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

      for (const row of validRows) {
        const empCode = row.code.trim().toUpperCase();
        const existing = await Employee.findByCode(empCode);
        const data = {
          name: row.name.trim(),
          role: row.role || ROLES.EMPLOYEE,
          departmentId: row.departmentId || null,
          blockId: row.blockId || null,
        };
        if (existing) {
          await Employee.updateByCode(empCode, data);
        } else {
          await Employee.create({ code: empCode, ...data });
        }
      }
      const staffRows = validRows.filter((r) => r.role === ROLES.ADMIN || r.role === ROLES.MANAGER).length;
      await audit(req, 'employee.import', `Nhập ${validRows.length} dòng${staffRows ? `, trong đó ${staffRows} dòng có vai trò quản trị` : ''}`);
      res.json({ importedCount: validRows.length });
    } catch (err) {
      next(err);
    }
  },

  // Lấy danh sách thay đổi thông tin nhân viên (cho trang Sắp chỗ)
  async getChangeLogs(req, res, next) {
    try {
      const logs = await EmployeeChangeLog.findAll();
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },

  // Đánh dấu đã xem / xóa thông báo thay đổi nhân viên
  async clearChangeLogs(req, res, next) {
    try {
      await EmployeeChangeLog.clearAll();
      res.json({ message: 'Đã đánh dấu đã xem.' });
    } catch (err) {
      next(err);
    }
  },
};

