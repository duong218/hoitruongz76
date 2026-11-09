import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ROLES, GUEST_GROUP_ID, GUEST_GROUP_NAME } from '../constants/roles.server.js';
import { Employee, Group, EventSetting } from '../models/index.js';
import { auditFailedLogin } from '../utils/audit.js';
import { eventGate, sendGate } from '../utils/eventWindow.js';
import { getCachedGroups, getCachedEvent } from '../utils/memoryCache.js';

const SESSION_DURATION_HOURS = 5;
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

      // Ngoài khung giờ sự kiện thì không ai vào được (chặn trước khi tra cứu cho nhẹ DB, dùng in-memory cache)
      const gate = eventGate(await getCachedEvent());
      if (gate) return sendGate(res, gate);

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

      const groups = await getCachedGroups();
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
      const event = await EventSetting.findOne({ key: 'main' });
      if (event && event.guestEnabled === false) {
        return res.status(403).json({ message: 'Chức năng khách mời hiện đang tắt. Vui lòng liên hệ ban tổ chức.' });
      }
      const gate = eventGate(event);
      if (gate) return sendGate(res, gate);

      const { fullName } = req.body;
      const trimmed = typeof fullName === 'string'
        ? fullName.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim()
        : '';
      if (!trimmed) {
        return res.status(400).json({ message: 'Vui lòng nhập họ và tên của quý khách.' });
      }
      if (trimmed.length > 60) {
        return res.status(400).json({ message: 'Họ và tên tối đa 60 ký tự.' });
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

  // 5. Đổi mật khẩu cho tài khoản nhân sự đang đăng nhập (Admin hoặc Quản lý)
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userCode = req.user?.code;

      if (!userCode) {
        return res.status(401).json({ message: 'Không xác định được danh tính người dùng.' });
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
      }

      // Tìm nhân sự kèm hash mật khẩu
      const employee = await Employee.findOne({ code: userCode }).select('+passwordHash');
      if (!employee || !employee.passwordHash) {
        return res.status(404).json({ message: 'Tài khoản không tồn tại hoặc chưa được thiết lập mật khẩu.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, employee.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
      }

      const sameAsOld = await bcrypt.compare(newPassword, employee.passwordHash);
      if (sameAsOld) {
        return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' });
      }

      // Cập nhật mật khẩu mới
      employee.passwordHash = await bcrypt.hash(newPassword, 10);
      employee.passwordChangedAt = new Date();
      await employee.save();

      // Mọi token cũ (kể cả phiên hiện tại) đã bị thu hồi; cấp token mới để người đổi không bị văng ra
      const token = jwt.sign(
        {
          code: employee.code,
          name: employee.name,
          role: employee.role,
          departmentId: employee.departmentId,
          blockId: employee.blockId,
        },
        env.JWT_SECRET,
        { expiresIn: `${SESSION_DURATION_HOURS}h` }
      );

      return res.json({
        ok: true,
        token,
        message: 'Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới của bạn.',
      });
    } catch (err) {
      next(err);
    }
  },
};