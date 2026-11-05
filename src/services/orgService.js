// MERN: thay bằng axios gọi /api/org/blocks và /api/org/departments
import { INITIAL_BLOCKS, INITIAL_DEPARTMENTS } from '../data/mockData.js';

const STORAGE_KEY_BLOCKS = 'z176_v2_blocks';
const STORAGE_KEY_DEPTS = 'z176_v2_departments';
const STORAGE_KEY_EMPLOYEES = 'z176_v2_employees';
const STORAGE_KEY_GROUPS = 'z176_v2_groups';

function getStoredBlocks() {
  const raw = localStorage.getItem(STORAGE_KEY_BLOCKS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(INITIAL_BLOCKS));
    return [...INITIAL_BLOCKS];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_BLOCKS];
  }
}

function saveBlocks(blocks) {
  localStorage.setItem(STORAGE_KEY_BLOCKS, JSON.stringify(blocks));
}

function getStoredDepartments() {
  const raw = localStorage.getItem(STORAGE_KEY_DEPTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
    return [...INITIAL_DEPARTMENTS];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_DEPARTMENTS];
  }
}

function saveDepartments(depts) {
  localStorage.setItem(STORAGE_KEY_DEPTS, JSON.stringify(depts));
}

export const orgService = {
  // ================= KHỐI (BLOCKS) =================
  async getBlocks() {
    await new Promise((r) => setTimeout(r, 40));
    return getStoredBlocks();
  },

  async addBlock({ name }) {
    await new Promise((r) => setTimeout(r, 60));
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Vui lòng nhập tên Khối.');

    const blocks = getStoredBlocks();
    if (blocks.some((b) => b.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Khối "${trimmed}" đã tồn tại trên hệ thống.`);
    }

    const newBlock = {
      id: 'block-' + Date.now().toString(36),
      name: trimmed,
    };
    saveBlocks([...blocks, newBlock]);
    return newBlock;
  },

  async updateBlock(id, { name }) {
    await new Promise((r) => setTimeout(r, 60));
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Vui lòng nhập tên Khối.');

    const blocks = getStoredBlocks();
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Không tìm thấy Khối cần cập nhật.');

    if (
      blocks.some(
        (b) => b.id !== id && b.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      throw new Error(`Tên Khối "${trimmed}" đã được sử dụng.`);
    }

    blocks[index] = { ...blocks[index], name: trimmed };
    saveBlocks(blocks);
    return blocks[index];
  },

  async deleteBlock(id) {
    await new Promise((r) => setTimeout(r, 60));
    const blocks = getStoredBlocks();
    const block = blocks.find((b) => b.id === id);
    if (!block) throw new Error('Không tìm thấy Khối cần xóa.');

    // 1. Kiểm tra nhân viên còn thuộc Khối này không
    let employeeCount = 0;
    try {
      const emps = JSON.parse(localStorage.getItem(STORAGE_KEY_EMPLOYEES) || '[]');
      employeeCount = emps.filter((e) => e.blockId === id).length;
    } catch {
      employeeCount = 0;
    }
    if (employeeCount > 0) {
      throw new Error(
        `"${block.name}" còn ${employeeCount} nhân viên, hãy chuyển họ sang Khối khác trước khi xóa.`
      );
    }

    // 2. Kiểm tra có phòng ban nào dùng làm Khối mặc định không
    let deptsUsingCount = 0;
    try {
      const depts = getStoredDepartments();
      deptsUsingCount = depts.filter((d) => d.blockId === id).length;
    } catch {
      deptsUsingCount = 0;
    }
    if (deptsUsingCount > 0) {
      throw new Error(
        `"${block.name}" đang là Khối mặc định của ${deptsUsingCount} phòng ban. Vui lòng chuyển phòng ban sang Khối khác trước.`
      );
    }

    // 3. Kiểm tra có nhóm ghế nào chứa Khối này không
    let groupUsingName = '';
    try {
      const groups = JSON.parse(localStorage.getItem(STORAGE_KEY_GROUPS) || '[]');
      const found = groups.find((g) => g.blockIds && g.blockIds.includes(id));
      if (found) groupUsingName = found.name;
    } catch {
      groupUsingName = '';
    }
    if (groupUsingName) {
      throw new Error(
        `"${block.name}" đang thuộc nhóm ghế "${groupUsingName}". Hãy gỡ Khối khỏi nhóm ghế trước khi xóa.`
      );
    }

    saveBlocks(blocks.filter((b) => b.id !== id));
  },

  // ================= PHÒNG BAN (DEPARTMENTS) =================
  async getDepartments() {
    await new Promise((r) => setTimeout(r, 40));
    return getStoredDepartments();
  },

  async addDepartment({ name, blockId }) {
    await new Promise((r) => setTimeout(r, 60));
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Vui lòng nhập tên Phòng ban / Phân xưởng.');
    if (!blockId) throw new Error('Vui lòng chọn Khối mặc định cho phòng ban.');

    const depts = getStoredDepartments();
    if (depts.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Phòng ban "${trimmed}" đã tồn tại trên hệ thống.`);
    }

    const newDept = {
      id: 'dept-' + Date.now().toString(36),
      name: trimmed,
      blockId,
    };
    saveDepartments([...depts, newDept]);
    return newDept;
  },

  async updateDepartment(id, { name, blockId }) {
    await new Promise((r) => setTimeout(r, 60));
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Vui lòng nhập tên Phòng ban / Phân xưởng.');
    if (!blockId) throw new Error('Vui lòng chọn Khối mặc định.');

    const depts = getStoredDepartments();
    const index = depts.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Không tìm thấy phòng ban cần sửa.');

    if (
      depts.some(
        (d) => d.id !== id && d.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      throw new Error(`Tên phòng ban "${trimmed}" đã tồn tại.`);
    }

    depts[index] = { ...depts[index], name: trimmed, blockId };
    saveDepartments(depts);
    return depts[index];
  },

  async deleteDepartment(id) {
    await new Promise((r) => setTimeout(r, 60));
    const depts = getStoredDepartments();
    const dept = depts.find((d) => d.id === id);
    if (!dept) throw new Error('Không tìm thấy phòng ban cần xóa.');

    // Kiểm tra còn nhân viên không
    let employeeCount = 0;
    try {
      const emps = JSON.parse(localStorage.getItem(STORAGE_KEY_EMPLOYEES) || '[]');
      employeeCount = emps.filter((e) => e.departmentId === id).length;
    } catch {
      employeeCount = 0;
    }
    if (employeeCount > 0) {
      throw new Error(
        `"${dept.name}" còn ${employeeCount} nhân viên, hãy chuyển họ sang phòng ban khác trước khi xóa.`
      );
    }

    saveDepartments(depts.filter((d) => d.id !== id));
  },
};
