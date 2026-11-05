// MERN: thay bằng axios gọi /api/employees
import { INITIAL_EMPLOYEES } from '../data/mockData.js';
import { ROLES } from '../constants/roles.js';

const STORAGE_KEY_EMPLOYEES = 'z176_v2_employees';

function getStoredEmployees() {
  if (typeof localStorage === 'undefined') {
    return [...INITIAL_EMPLOYEES];
  }
  const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    return [...INITIAL_EMPLOYEES];
  }
  try {
    const parsed = JSON.parse(raw);
    // Bổ sung mật khẩu demo nếu dữ liệu cũ chưa có
    let modified = false;
    parsed.forEach((emp) => {
      if (emp.code === 'ADMIN01' && !emp.password) {
        emp.password = 'admin@123';
        modified = true;
      } else if (emp.code === 'QL01' && !emp.password) {
        emp.password = 'ql@12345';
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [...INITIAL_EMPLOYEES];
  }
}

function saveEmployees(emps) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(emps));
  }
}

export const employeeService = {
  async getEmployees() {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return getStoredEmployees();
  },

  async addEmployee({ code, name, role, departmentId, blockId, password }) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const trimmedCode = (code || '').trim().toUpperCase();
    const trimmedName = (name || '').trim();

    if (!trimmedCode) throw new Error('Vui lòng nhập mã nhân viên.');
    if (!trimmedName) throw new Error('Vui lòng nhập họ và tên nhân viên.');

    const employees = getStoredEmployees();
    if (employees.some((e) => e.code.toUpperCase() === trimmedCode)) {
      throw new Error(`Mã nhân viên "${trimmedCode}" đã tồn tại trên hệ thống.`);
    }

    const assignedRole = role || ROLES.EMPLOYEE;
    const isStaff = assignedRole === ROLES.ADMIN || assignedRole === ROLES.MANAGER;

    if (isStaff) {
      const trimmedPass = (password || '').trim();
      if (!trimmedPass) {
        throw new Error('Vui lòng nhập mật khẩu cho tài khoản quản trị.');
      }
      if (trimmedPass.length < 8) {
        throw new Error('Mật khẩu quản trị phải có tối thiểu 8 ký tự.');
      }
    }

    const newEmp = {
      code: trimmedCode,
      name: trimmedName,
      role: assignedRole,
      departmentId: departmentId || null,
      blockId: blockId || null,
    };

    if (isStaff) {
      newEmp.password = (password || '').trim();
    }

    saveEmployees([...employees, newEmp]);
    return newEmp;
  },

  async updateEmployee(code, { name, role, departmentId, blockId, password }) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const employees = getStoredEmployees();
    const index = employees.findIndex((e) => e.code.toUpperCase() === code.toUpperCase());
    if (index === -1) {
      throw new Error('Không tìm thấy nhân viên cần cập nhật.');
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Vui lòng nhập họ và tên nhân viên.');

    const newRole = role || employees[index].role;
    const isStaff = newRole === ROLES.ADMIN || newRole === ROLES.MANAGER;

    const updated = {
      ...employees[index],
      name: trimmedName,
      role: newRole,
      departmentId: departmentId !== undefined ? departmentId : employees[index].departmentId,
      blockId: blockId !== undefined ? blockId : employees[index].blockId,
    };

    if (isStaff) {
      // Nếu có nhập mật khẩu mới
      if (password && password.trim()) {
        const trimmedPass = password.trim();
        if (trimmedPass.length < 8) {
          throw new Error('Mật khẩu quản trị phải có tối thiểu 8 ký tự.');
        }
        updated.password = trimmedPass;
      } else if (!updated.password) {
        // Nếu chuyển từ Employee sang Admin/Manager nhưng không nhập mật khẩu
        throw new Error('Tài khoản quản trị bắt buộc phải có mật khẩu (tối thiểu 8 ký tự).');
      }
    } else {
      // Vai trò Nhân viên thì xóa mật khẩu nếu đổi từ Quản trị/Quản lý sang Nhân viên
      delete updated.password;
    }

    employees[index] = updated;
    saveEmployees(employees);
    return updated;
  },

  async deleteEmployee(code) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const employees = getStoredEmployees();
    const filtered = employees.filter((e) => e.code.toUpperCase() !== code.toUpperCase());
    if (filtered.length === employees.length) {
      throw new Error('Không tìm thấy nhân viên để xóa.');
    }
    saveEmployees(filtered);
  },

  async importEmployees(validRows) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const employees = getStoredEmployees();
    const map = new Map(employees.map((e) => [e.code.toUpperCase(), e]));

    let count = 0;
    validRows.forEach((row) => {
      const codeUpper = row.code.trim().toUpperCase();
      map.set(codeUpper, {
        code: codeUpper,
        name: row.name.trim(),
        role: row.role || ROLES.EMPLOYEE,
        departmentId: row.departmentId || null,
        blockId: row.blockId || null,
      });
      count++;
    });

    saveEmployees(Array.from(map.values()));
    return { importedCount: count };
  },
};
