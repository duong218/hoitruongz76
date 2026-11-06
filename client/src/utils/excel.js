import * as XLSX from 'xlsx';
import { ROLES, ROLE_LABELS } from '../constants/roles.js';

/**
 * Kiểm tra tính hợp lệ của 1 dòng Excel theo schema mới
 * Cột: Mã NV, Họ và tên, Phòng ban, Khối (bỏ trống = Khối mặc định), Vai trò (bỏ trống = Nhân viên)
 * @param {{ code: string, name: string, departmentName?: string, blockName?: string, role?: string }} row
 * @param {Set<string>} existingCodes
 * @param {Array<{ id: string, name: string }>} blocks
 * @param {Array<{ id: string, name: string, blockId: string }>} departments
 * @param {Set<string>} seenInFileCodes
 * @returns {{ isValid: boolean, error: string | null, parsed: object }}
 */
export function validateImportRow(
  row,
  existingCodes,
  blocks = [],
  departments = [],
  seenInFileCodes = new Set()
) {
  const code = (row.code || '').trim().toUpperCase();
  const name = (row.name || '').trim();
  const departmentName = (row.departmentName || '').trim();
  const blockName = (row.blockName || '').trim();
  const rawRole = (row.role || '').trim();

  if (!code) {
    return {
      isValid: false,
      error: 'Thiếu mã nhân viên',
      parsed: { code, name, departmentId: null, blockId: null, role: ROLES.EMPLOYEE },
    };
  }

  if (!name) {
    return {
      isValid: false,
      error: 'Thiếu họ và tên',
      parsed: { code, name, departmentId: null, blockId: null, role: ROLES.EMPLOYEE },
    };
  }

  if (existingCodes.has(code)) {
    return {
      isValid: false,
      error: `Trùng mã nhân viên "${code}" đã có trên hệ thống`,
      parsed: { code, name, departmentId: null, blockId: null, role: ROLES.EMPLOYEE },
    };
  }

  if (seenInFileCodes.has(code)) {
    return {
      isValid: false,
      error: `Trùng lặp mã nhân viên "${code}" trong file`,
      parsed: { code, name, departmentId: null, blockId: null, role: ROLES.EMPLOYEE },
    };
  }

  // Phân tích vai trò (mặc định Nhân viên)
  let role = ROLES.EMPLOYEE;
  if (rawRole) {
    const lower = rawRole.toLowerCase();
    if (
      lower.includes('admin') ||
      lower.includes('quản trị') ||
      lower.includes('quản lý') ||
      lower.includes('manager')
    ) {
      return {
        isValid: false,
        error: 'Tài khoản quản trị phải tạo bằng form, không nhập qua Excel.',
        parsed: { code, name, departmentId: null, blockId: null, role: ROLES.EMPLOYEE },
      };
    } else if (lower.includes('nhân viên') || lower.includes('employee')) {
      role = ROLES.EMPLOYEE;
    } else {
      return {
        isValid: false,
        error: `Vai trò "${rawRole}" không hợp lệ (hợp lệ: Nhân viên)`,
        parsed: { code, name, departmentId: null, blockId: null, role: ROLES.EMPLOYEE },
      };
    }
  }

  // Phân tích Phòng ban
  let matchedDepartment = null;
  if (departmentName) {
    matchedDepartment = departments.find(
      (d) => d.name.toLowerCase() === departmentName.toLowerCase()
    );
    if (!matchedDepartment) {
      return {
        isValid: false,
        error: `Phòng ban "${departmentName}" không tồn tại trên hệ thống`,
        parsed: { code, name, departmentId: null, blockId: null, role },
      };
    }
  }

  // Phân tích Khối
  let matchedBlock = null;
  if (blockName) {
    matchedBlock = blocks.find(
      (b) => b.name.toLowerCase() === blockName.toLowerCase()
    );
    if (!matchedBlock) {
      return {
        isValid: false,
        error: `Khối "${blockName}" không tồn tại trên hệ thống`,
        parsed: { code, name, departmentId: matchedDepartment?.id || null, blockId: null, role },
      };
    }
  } else if (matchedDepartment) {
    // Nếu bỏ trống khối, tự điền theo Khối mặc định của phòng ban
    matchedBlock = blocks.find((b) => b.id === matchedDepartment.blockId) || null;
  }

  // Đối với nhân viên, bắt buộc phải có Phòng ban và Khối
  if (role === ROLES.EMPLOYEE && (!matchedDepartment || !matchedBlock)) {
    return {
      isValid: false,
      error: 'Nhân viên bắt buộc phải có Phòng ban và Khối hợp lệ',
      parsed: {
        code,
        name,
        departmentId: matchedDepartment?.id || null,
        blockId: matchedBlock?.id || null,
        role,
      },
    };
  }

  return {
    isValid: true,
    error: null,
    parsed: {
      code,
      name,
      departmentId: matchedDepartment ? matchedDepartment.id : null,
      blockId: matchedBlock ? matchedBlock.id : null,
      role,
    },
  };
}

/**
 * Đọc và phân tích file Excel theo schema mới
 * @param {File} file
 * @param {string[]} existingEmployeeCodes
 * @param {Array<{ id: string, name: string }>} blocks
 * @param {Array<{ id: string, name: string, blockId: string }>} departments
 */
export async function parseEmployeeExcel(file, existingEmployeeCodes = [], blocks = [], departments = []) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('File Excel rỗng hoặc không có dòng dữ liệu.');
  }

  const existingCodesSet = new Set(existingEmployeeCodes.map((c) => c.toUpperCase()));
  const seenInFileCodes = new Set();
  const results = [];

  // Tìm index của các cột từ dòng tiêu đề (dòng 0)
  const header = (rawRows[0] || []).map((h) => String(h || '').trim().toLowerCase());
  let codeIdx = header.findIndex((h) => h.includes('mã') || h.includes('code'));
  let nameIdx = header.findIndex((h) => h.includes('tên') || h.includes('họ') || h.includes('name'));
  let deptIdx = header.findIndex((h) => h.includes('phòng') || h.includes('ban') || h.includes('dept'));
  let blockIdx = header.findIndex((h) => h.includes('khối') || h.includes('block'));
  let roleIdx = header.findIndex((h) => h.includes('vai trò') || h.includes('role') || h.includes('chức vụ'));

  if (codeIdx === -1) codeIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (deptIdx === -1) deptIdx = 2;
  if (blockIdx === -1) blockIdx = 3;
  if (roleIdx === -1) roleIdx = 4;

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every((c) => c === undefined || c === '')) {
      continue;
    }

    const code = String(row[codeIdx] || '').trim();
    const name = String(row[nameIdx] || '').trim();
    const departmentName = String(row[deptIdx] || '').trim();
    const blockName = String(row[blockIdx] || '').trim();
    const role = String(row[roleIdx] || '').trim();

    const check = validateImportRow(
      { code, name, departmentName, blockName, role },
      existingCodesSet,
      blocks,
      departments,
      seenInFileCodes
    );

    if (check.isValid) {
      seenInFileCodes.add(check.parsed.code);
    }

    results.push({
      rowNumber: i + 1,
      code,
      name,
      departmentName,
      blockName,
      role: role || 'Nhân viên',
      isValid: check.isValid,
      error: check.error,
      parsed: check.parsed,
    });
  }

  return results;
}

// Mẫu nhập có định dạng nằm ở utils/excelExport.js (exceljs, tải khi bấm nút)
export { downloadEmployeeTemplate } from './excelExport.js';
