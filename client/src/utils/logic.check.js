import assert from 'node:assert';
import { summarizeSeats, formatSeatRanges } from './seatSummary.js';
import { validateImportRow } from './excel.js';
import { resolveGroup } from './resolveGroup.js';
import { validateCheckIn, CHECKIN_CODES } from './checkIn.js';
import { verifyStaffLogin } from './staffAuth.js';
import { attendeeService, ATTENDEE_LOGIN_CODES } from '../services/attendeeService.js';
import { rowSeatIds, seatId } from '../constants/hall.js';
import { ROLES, GUEST_GROUP_ID } from '../constants/roles.js';

console.log('--- Đang chạy kiểm thử logic toàn diện (Z176 Comprehensive Logic Check) ---');

// ==========================================
// 1. KIỂM THỬ HÀM formatSeatRanges VÀ summarizeSeats
// ==========================================
{
  assert.strictEqual(formatSeatRanges([]), '', 'Mảng rỗng');
  assert.strictEqual(formatSeatRanges([5]), 'ghế 5', 'Một ghế đơn lẻ');
  assert.strictEqual(formatSeatRanges([6, 7, 8, 9, 10]), 'ghế 6-10', 'Dải ghế liên tiếp');
  assert.strictEqual(formatSeatRanges([1, 2, 3, 7, 8]), 'ghế 1-3, ghế 7-8', 'Nhiều dải ghế');

  assert.strictEqual(summarizeSeats([]), 'Chưa có chỗ');
  const row3Seats = rowSeatIds(3);
  assert.strictEqual(summarizeSeats(row3Seats), 'Hàng 3 (cả hàng)');

  const row8Partial = [6, 7, 8, 9, 10].map((n) => seatId(8, 'L', n));
  assert.strictEqual(summarizeSeats(row8Partial), 'Hàng 8 (bên trái, ghế 6-10)');

  const combinedSeats = [...row3Seats, ...row8Partial];
  assert.strictEqual(
    summarizeSeats(combinedSeats),
    'Hàng 3 (cả hàng), Hàng 8 (bên trái, ghế 6-10)'
  );

  console.log('✓ 1. summarizeSeats đạt 100%!');
}

// ==========================================
// 2. KIỂM THỬ HÀM validateImportRow (Schema mới + chặn Admin/Manager qua Excel)
// ==========================================
{
  const mockBlocks = [
    { id: 'b-cq', name: 'Khối cơ quan' },
    { id: 'b-px', name: 'Khối phân xưởng' },
  ];
  const mockDepts = [
    { id: 'd-kh', name: 'Phòng Kế hoạch', blockId: 'b-cq' },
    { id: 'd-px1', name: 'Phân xưởng 1', blockId: 'b-px' },
  ];
  const existingCodes = new Set(['NV001', 'ADMIN01']);
  const seenCodes = new Set();

  // Ca hợp lệ đầy đủ
  const valid = validateImportRow(
    { code: 'NV101', name: 'Nguyễn Văn Minh', departmentName: 'Phòng Kế hoạch', blockName: 'Khối cơ quan' },
    existingCodes,
    mockBlocks,
    mockDepts,
    seenCodes
  );
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.parsed.blockId, 'b-cq');
  assert.strictEqual(valid.parsed.departmentId, 'd-kh');

  // Ca tự điền khối mặc định khi bỏ trống
  const autoBlock = validateImportRow(
    { code: 'NV102', name: 'Lê Thị Hoa', departmentName: 'Phòng Kế hoạch', blockName: '' },
    existingCodes,
    mockBlocks,
    mockDepts,
    seenCodes
  );
  assert.strictEqual(autoBlock.isValid, true);
  assert.strictEqual(autoBlock.parsed.blockId, 'b-cq', 'Tự lấy khối mặc định của phòng ban');

  // Ca trùng mã trên hệ thống
  const dupSys = validateImportRow(
    { code: 'NV001', name: 'Trùng', departmentName: 'Phòng Kế hoạch' },
    existingCodes,
    mockBlocks,
    mockDepts,
    seenCodes
  );
  assert.strictEqual(dupSys.isValid, false);
  assert(dupSys.error.includes('đã có trên hệ thống'));

  // Ca phòng ban không tồn tại
  const badDept = validateImportRow(
    { code: 'NV103', name: 'Phòng Ảo', departmentName: 'Phòng Vũ Khí' },
    existingCodes,
    mockBlocks,
    mockDepts,
    seenCodes
  );
  assert.strictEqual(badDept.isValid, false);
  assert(badDept.error.includes('không tồn tại'));

  // Ca vai trò Quản trị hoặc Quản lý: PHẢI bị từ chối
  const staffRow = validateImportRow(
    { code: 'ADMIN99', name: 'Quản trị viên 99', role: 'Quản trị', departmentName: 'Phòng Kế hoạch' },
    existingCodes,
    mockBlocks,
    mockDepts,
    seenCodes
  );
  assert.strictEqual(staffRow.isValid, false);
  assert.strictEqual(staffRow.error, 'Tài khoản quản trị phải tạo bằng form, không nhập qua Excel.');

  const managerRow = validateImportRow(
    { code: 'QL99', name: 'Quản lý 99', role: 'Quản lý', departmentName: 'Phòng Kế hoạch' },
    existingCodes,
    mockBlocks,
    mockDepts,
    seenCodes
  );
  assert.strictEqual(managerRow.isValid, false);
  assert.strictEqual(managerRow.error, 'Tài khoản quản trị phải tạo bằng form, không nhập qua Excel.');

  console.log('✓ 2. validateImportRow (kèm chặn Admin/Manager) đạt 100%!');
}

// ==========================================
// 3. KIỂM THỬ HÀM resolveGroup
// ==========================================
{
  const mockGroups = [
    { id: 'grp-cq', name: 'Khối cơ quan', blockIds: ['b-cq'], checkInRequired: true },
    { id: 'grp-px', name: 'Khối phân xưởng', blockIds: ['b-px'], checkInRequired: true },
    { id: GUEST_GROUP_ID, name: 'Khách mời', blockIds: [], isSystem: true, checkInRequired: false },
  ];

  // Khách mời
  const guestUser = { code: 'GUEST_9999', name: 'Khách VIP', role: ROLES.GUEST, isGuest: true };
  const g1 = resolveGroup(guestUser, mockGroups);
  assert.strictEqual(g1.id, GUEST_GROUP_ID);

  // Nhân viên có khối cơ quan
  const emp1 = { code: 'NV1', role: ROLES.EMPLOYEE, blockId: 'b-cq' };
  const g2 = resolveGroup(emp1, mockGroups);
  assert.strictEqual(g2.id, 'grp-cq');

  // Nhân viên có khối phân xưởng
  const emp2 = { code: 'NV2', role: ROLES.EMPLOYEE, blockId: 'b-px' };
  const g3 = resolveGroup(emp2, mockGroups);
  assert.strictEqual(g3.id, 'grp-px');

  // Nhân viên chưa có khối hoặc khối chưa gán nhóm
  const emp3 = { code: 'NV3', role: ROLES.EMPLOYEE, blockId: 'b-unknown' };
  assert.strictEqual(resolveGroup(emp3, mockGroups), null);

  console.log('✓ 3. resolveGroup đạt 100%!');
}

// ==========================================
// 4. KIỂM THỬ HÀM validateCheckIn
// ==========================================
{
  const mockGroup = { id: 'grp-test', name: 'Nhóm Test', checkInRequired: true };
  const mockVipGroup = { id: 'grp-vip', name: 'Khách VIP', checkInRequired: false };
  const mockSeatGroups = {
    '5-L-3': 'grp-test',
    '1-L-1': 'grp-vip',
  };
  const mockTokens = {
    '5-L-3': 'TOKEN5',
    '1-L-1': 'VIPTOK',
  };
  const mockEvent = { checkInOpen: true, seatTokens: mockTokens };
  const mockAttendance = [
    { employeeCode: 'NV_DONE', seatId: '5-L-3', checkedInAt: '2026-11-04T08:00:00.000Z' },
  ];

  // 4.1. NOT_REQUIRED: Nhóm miễn điểm danh
  const resNotReq = validateCheckIn({
    user: { code: 'NV_VIP', role: ROLES.EMPLOYEE },
    group: mockVipGroup,
    seatGroups: mockSeatGroups,
    seatId: '1-L-1',
    token: 'VIPTOK',
    event: mockEvent,
    attendance: mockAttendance,
  });
  assert.strictEqual(resNotReq.code, CHECKIN_CODES.NOT_REQUIRED);

  // 4.2. CLOSED: Sự kiện đóng điểm danh
  const resClosed = validateCheckIn({
    user: { code: 'NV101', role: ROLES.EMPLOYEE },
    group: mockGroup,
    seatGroups: mockSeatGroups,
    seatId: '5-L-3',
    token: 'TOKEN5',
    event: { checkInOpen: false, seatTokens: mockTokens },
    attendance: mockAttendance,
  });
  assert.strictEqual(resClosed.code, CHECKIN_CODES.CLOSED);

  // 4.3. INVALID_QR: Sai mã token hoặc sai định dạng ghế
  const resBadToken = validateCheckIn({
    user: { code: 'NV101', role: ROLES.EMPLOYEE },
    group: mockGroup,
    seatGroups: mockSeatGroups,
    seatId: '5-L-3',
    token: 'WRONG_TOKEN',
    event: mockEvent,
    attendance: mockAttendance,
  });
  assert.strictEqual(resBadToken.code, CHECKIN_CODES.INVALID_QR);

  // 4.4. WRONG_SEAT: Ghế thuộc nhóm khác
  const resWrongSeat = validateCheckIn({
    user: { code: 'NV101', role: ROLES.EMPLOYEE },
    group: mockGroup,
    seatGroups: mockSeatGroups,
    seatId: '1-L-1', // Ghế VIP thuộc nhóm grp-vip
    token: 'VIPTOK',
    event: mockEvent,
    attendance: mockAttendance,
  });
  assert.strictEqual(resWrongSeat.code, CHECKIN_CODES.WRONG_SEAT);

  // 4.5. ALREADY: Người này đã điểm danh rồi
  const resAlready = validateCheckIn({
    user: { code: 'NV_DONE', role: ROLES.EMPLOYEE },
    group: mockGroup,
    seatGroups: mockSeatGroups,
    seatId: '5-L-3',
    token: 'TOKEN5',
    event: mockEvent,
    attendance: mockAttendance,
  });
  assert.strictEqual(resAlready.code, CHECKIN_CODES.ALREADY);

  // 4.6. OK: Hợp lệ 100%
  const resOk = validateCheckIn({
    user: { code: 'NV_NEW', role: ROLES.EMPLOYEE },
    group: mockGroup,
    seatGroups: mockSeatGroups,
    seatId: '5-L-3',
    token: 'TOKEN5',
    event: mockEvent,
    attendance: mockAttendance,
  });
  assert.strictEqual(resOk.code, CHECKIN_CODES.OK);
  assert.strictEqual(resOk.ok, true);

  console.log('✓ 4. validateCheckIn (đủ 6 mã kết quả) đạt 100%!');
}

// ==========================================
// 5. KIỂM THỬ verifyStaffLogin (Tài khoản Quản trị & Mật khẩu)
// ==========================================
{
  const mockStaffList = [
    { code: 'ADMIN01', name: 'Admin Z176', role: ROLES.ADMIN, password: 'admin@123' },
    { code: 'QL01', name: 'Quản Lý Z176', role: ROLES.MANAGER, password: 'ql@12345' },
    { code: 'NV001', name: 'Nhân Viên An', role: ROLES.EMPLOYEE, password: 'employee@123' },
  ];

  // 5.1. Đúng mã + đúng mật khẩu (Admin) -> OK
  const resAdminOk = verifyStaffLogin(mockStaffList, 'ADMIN01', 'admin@123');
  assert.strictEqual(resAdminOk.ok, true);
  assert.strictEqual(resAdminOk.user.role, ROLES.ADMIN);
  assert.strictEqual(resAdminOk.user.code, 'ADMIN01');

  // 5.2. Đúng mã + đúng mật khẩu (Quản lý) -> OK
  const resManagerOk = verifyStaffLogin(mockStaffList, 'QL01', 'ql@12345');
  assert.strictEqual(resManagerOk.ok, true);
  assert.strictEqual(resManagerOk.user.role, ROLES.MANAGER);

  // 5.3. Sai mật khẩu -> Không được
  const resWrongPass = verifyStaffLogin(mockStaffList, 'ADMIN01', 'sai_mat_khau');
  assert.strictEqual(resWrongPass.ok, false);
  assert.strictEqual(resWrongPass.error, 'Mã hoặc mật khẩu không đúng.');

  // 5.4. Mã nhân viên thường (dù đúng pass nhân viên) -> Không được
  const resEmp = verifyStaffLogin(mockStaffList, 'NV001', 'employee@123');
  assert.strictEqual(resEmp.ok, false);
  assert.strictEqual(resEmp.error, 'Mã hoặc mật khẩu không đúng.');

  // 5.5. Mã không tồn tại -> Không được
  const resNotFound = verifyStaffLogin(mockStaffList, 'NON_EXISTENT', 'admin@123');
  assert.strictEqual(resNotFound.ok, false);
  assert.strictEqual(resNotFound.error, 'Mã hoặc mật khẩu không đúng.');

  console.log('✓ 5. verifyStaffLogin (đúng mã/mật khẩu, sai mật khẩu, nhân viên thường, không tồn tại) đạt 100%!');
}

// ==========================================
// 6. KIỂM THỬ attendeeService.lookupByCode (Chặn Admin/Quản lý tại trang công khai)
// ==========================================
{
  async function testAttendeeLookup() {
    // 6.1. Mã Admin bị từ chối với mã ROLE_NEEDS_PASSWORD
    const resAdmin = await attendeeService.lookupByCode('ADMIN01');
    assert.strictEqual(resAdmin.ok, false);
    assert.strictEqual(resAdmin.code, ATTENDEE_LOGIN_CODES.ROLE_NEEDS_PASSWORD);
    assert.strictEqual(
      resAdmin.message,
      'Mã này dành cho tài khoản quản trị. Vui lòng đăng nhập ở trang quản trị.'
    );

    // 6.2. Mã Quản lý bị từ chối với mã ROLE_NEEDS_PASSWORD
    const resManager = await attendeeService.lookupByCode('QL01');
    assert.strictEqual(resManager.ok, false);
    assert.strictEqual(resManager.code, ATTENDEE_LOGIN_CODES.ROLE_NEEDS_PASSWORD);

    // 6.3. Mã Nhân viên thường -> OK
    const resEmp = await attendeeService.lookupByCode('NV001');
    assert.strictEqual(resEmp.ok, true);
    assert.strictEqual(resEmp.code, ATTENDEE_LOGIN_CODES.OK);
    assert.strictEqual(resEmp.user.code, 'NV001');

    console.log('✓ 6. attendeeService.lookupByCode (chặn Admin/Quản lý với ROLE_NEEDS_PASSWORD) đạt 100%!');
  }

  await testAttendeeLookup();
}

console.log('--- TẤT CẢ KIỂM THỬ LOGIC Z176 ĐÃ VƯỢT QUA XUẤT SẮC! ---');
