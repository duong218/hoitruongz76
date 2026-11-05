import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ROLES, GUEST_GROUP_ID, GUEST_GROUP_NAME } from '../constants/roles.server.js';
import { Employee, Group } from '../models/index.js';
import { auditFailedLogin } from '../utils/audit.js';

const SESSION_DURATION_HOURS = 8;
const ATTENDEE_SESSION_HOURS = 12;

export const authController = {
  // 1. Đăng nhập Staff (ADMIN / MANAGER)
  async loginStaff(req, res, next) {
    try {
      const { code, password } = req.body;
      const trimmedCode = (code || '').trim().toUpperCase();
      const trimmedPassword = (password || '').trim();

      if (!trimmedCode || !trimmedPassword) {
        return res.status(400).json({ message: 'Mã hoặc mật khẩu không đúng.' });
      }

      const staff = await Employee.findOne({ code: trimmedCode }).select('+passwordHash');
      if (!staff || (staff.role !== ROLES.ADMIN && staff.role !== ROLES.MANAGER)) {
        await auditFailedLogin(trimmedCode);
        return res.status(400).json({ message: 'Mã hoặc mật khẩu không đúng.' });
      }

      const isMatch = await bcrypt.compare(trimmedPassword, staff.passwordHash || '');
      if (!isMatch) {
        await auditFailedLogin(trimmedCode);
        return res.status(400).json({ message: 'Mã hoặc mật khẩu không đúng.' });
      }

      const payload = {
        code: staff.code,
        name: staff.name,
        role: staff.role,
        departmentId: staff.departmentId,
        blockId: staff.blockId,
      };

      const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: `${SESSION_DURATION_HOURS}h`,
      });

      const expiresAt = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;

      return res.json({
        token,
        expiresAt,
        user: {
          ...payload,
          expiresAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Tra cứu mã người tham dự (EMPLOYEE)
  async lookupAttendee(req, res, next) {
    try {
      const { code } = req.body;
      const trimmedCode = (code || '').trim().toUpperCase();

      if (!trimmedCode) {
        return res.status(400).json({ message: 'Vui lòng nhập mã nhân viên.' });
      }

      const employee = await Employee.findOne({ code: trimmedCode });
      if (!employee) {
        return res.status(404).json({ message: 'Không tìm thấy mã nhân viên này. Vui lòng kiểm tra lại.' });
      }

      if (employee.role === ROLES.ADMIN || employee.role === ROLES.MANAGER) {
        return res.status(403).json({
          code: 'ROLE_NEEDS_PASSWORD',
          message: 'Mã này dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị.',
        });
      }

      const groups = await Group.find();
      const matchedGroup = employee.blockId
        ? groups.find((g) => Array.isArray(g.blockIds) && g.blockIds.includes(employee.blockId))
        : null;

      const authUser = {
        code: employee.code,
        name: employee.name,
        role: employee.role,
        departmentId: employee.departmentId || null,
        blockId: employee.blockId || null,
        groupId: matchedGroup ? matchedGroup.id : null,
        groupName: matchedGroup ? matchedGroup.name : 'Chưa phân nhóm',
        isGuest: false,
      };

      // Phiên cho nhân viên: chỉ dùng để điểm danh, hết hạn sau 12 giờ.
      // Khách mời không cần phiên vì không điểm danh và không lưu gì trên server.
      const token = jwt.sign(
        { code: employee.code, name: employee.name, role: employee.role, blockId: employee.blockId || null },
        env.JWT_SECRET,
        { expiresIn: `${ATTENDEE_SESSION_HOURS}h` }
      );

      return res.json({
        ok: true,
        user: authUser,
        group: matchedGroup,
        token,
      });
    } catch (err) {
      next(err);
    }
  },

  // 3. Đăng nhập khách mời
  async enterAsGuest(req, res, next) {
    try {
      const { fullName } = req.body;
      const trimmed = (fullName || '').trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Vui lòng nhập họ và tên của quý khách.' });
      }

      const guestGroup = (await Group.findOne({ id: GUEST_GROUP_ID })) || {
        id: GUEST_GROUP_ID,
        name: GUEST_GROUP_NAME,
        color: '#475569',
        isSystem: true,
        checkInRequired: false,
        blockIds: [],
      };

      const authUser = {
        code: 'GUEST_' + Date.now().toString().slice(-4),
        name: trimmed,
        role: ROLES.GUEST,
        departmentId: null,
        blockId: null,
        groupId: GUEST_GROUP_ID,
        groupName: guestGroup.name,
        isGuest: true,
      };

      return res.json({
        ok: true,
        user: authUser,
        group: guestGroup,
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Lấy thông tin phiên hiện tại
  getMe(req, res) {
    res.json({ user: req.user });
  },
};

