import { Attendance, Employee, Group, Block, Department, EventSetting, EventArchive } from '../models/index.js';

// ponytail: khóa trong 1 tiến trình; chạy nhiều instance thì cần khóa trong DB.
let busy = false;
export async function withArchiveLock(fn) {
  if (busy) {
    const e = new Error('Hệ thống đang lưu/đặt lại điểm danh, vui lòng thử lại sau vài giây.');
    e.status = 409;
    throw e;
  }
  busy = true;
  try {
    return await fn();
  } finally {
    busy = false;
  }
}

/**
 * Chụp sự kiện hiện tại vào EventArchive RỒI mới xóa đúng những bản ghi đã chụp.
 * Lưu lỗi thì không xóa gì. Không có ai điểm danh thì không lưu (trả null, vẫn xóa nếu có gì).
 * @returns {Promise<object|null>} bản lưu (có rows) hoặc null
 */
export async function archiveAndClear(req, cause) {
  const records = await Attendance.find().lean();
  if (!records.length) return null;

  const [event, employees, groups, blocks, depts] = await Promise.all([
    EventSetting.findOne({ key: 'main' }).lean(),
    Employee.find().lean(),
    Group.find().lean(),
    Block.find().lean(),
    Department.find().lean(),
  ]);
  const blockName = new Map(blocks.map((b) => [b.id, b.name]));
  const deptName = new Map(depts.map((d) => [d.id, d.name]));
  const recMap = new Map(records.map((r) => [r.employeeCode, r]));

  const base = (emp) => {
    const g = emp.blockId ? groups.find((x) => (x.blockIds || []).includes(emp.blockId)) : null;
    return {
      code: emp.code,
      name: emp.name,
      block: blockName.get(emp.blockId) || '',
      dept: deptName.get(emp.departmentId) || '',
      group: g?.name || '',
      required: !!g?.checkInRequired && emp.role !== 'GUEST',
    };
  };
  const withRec = (b, r) => ({
    ...b,
    checked: !!r,
    seatId: r?.seatId || '',
    checkedInAt: r?.checkedInAt || null,
    method: r?.method || '',
    checkedInBy: r?.checkedInBy || '',
    reason: r?.reason || '',
  });

  // Mọi nhân viên bắt buộc (kể cả vắng) + mọi người đã điểm danh. Nhân viên đã bị xóa khỏi hệ thống vẫn giữ mã.
  const rows = [];
  const seen = new Set();
  for (const emp of employees) {
    const b = base(emp);
    const r = recMap.get(emp.code);
    if (!b.required && !r) continue;
    rows.push(withRec(b, r));
    seen.add(emp.code);
  }
  for (const r of records) {
    if (!seen.has(r.employeeCode)) {
      rows.push(withRec({ code: r.employeeCode, name: '(đã xóa khỏi hệ thống)', block: '', dept: '', group: '', required: false }, r));
    }
  }

  const archive = await EventArchive.create({
    eventName: event?.eventName || 'Sự kiện',
    startedAt: event?.startedAt || null,
    archivedBy: req.user?.code || '',
    cause,
    summary: {
      required: rows.filter((r) => r.required).length,
      checked: rows.filter((r) => r.checked).length,
      proxy: rows.filter((r) => r.method === 'PROXY').length,
    },
    rows,
  });

  // Chỉ xóa đúng các bản ghi đã chụp: ai điểm danh sau lúc chụp không bị mất.
  await Attendance.deleteMany({ _id: { $in: records.map((r) => r._id) } });
  return archive;
}
