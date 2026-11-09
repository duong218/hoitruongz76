import { AuditLog, Attendance, Employee, Group, Block, Department, EventSetting, EventArchive } from '../models/index.js';

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
 * Chụp sự kiện hiện tại vào EventArchive (KHÔNG xóa gì). Không có ai điểm danh thì trả null.
 * @returns {Promise<{archive: object, ids: any[]}|null>}
 */
async function snapshot(req, cause) {
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
    archivedBy: req?.user?.code || 'Hệ thống',
    cause,
    summary: {
      required: rows.filter((r) => r.required).length,
      checked: rows.filter((r) => r.checked).length,
      proxy: rows.filter((r) => r.method === 'PROXY').length,
    },
    rows,
  });

  return { archive, ids: records.map((r) => r._id) };
}

/**
 * Lưu lịch sử RỒI mới xóa đúng những bản ghi đã chụp (ai điểm danh sau lúc chụp không bị mất).
 * Lưu lỗi thì không xóa gì. Không có ai điểm danh thì không lưu (trả null).
 * Nếu sự kiện đã được tự lưu lúc hết giờ và dữ liệu chưa đổi thì dùng lại bản đó, không tạo bản trùng.
 * ponytail: so sánh bằng số lượt điểm danh; điểm danh hộ sau giờ đóng làm lệch số lượt thì sẽ lưu thêm một bản mới.
 * @returns {Promise<object|null>} bản lưu (có rows) hoặc null
 */
export async function archiveAndClear(req, cause) {
  const ev = await EventSetting.findOne({ key: 'main' }).lean();
  if (ev?.archivedId) {
    const existing = await EventArchive.findById(ev.archivedId);
    if (existing && existing.summary.checked === (await Attendance.countDocuments())) {
      await Attendance.deleteMany({});
      return existing;
    }
  }
  const snap = await snapshot(req, cause);
  if (!snap) return null;
  await Attendance.deleteMany({ _id: { $in: snap.ids } });
  return snap.archive;
}

/**
 * Hết giờ đóng thì tự lưu sự kiện vào lịch sử (giữ nguyên điểm danh để quản lý còn xem/xuất).
 * Mỗi sự kiện chỉ xử lý một lần (endHandledAt). Lỗi thì thử lại ở lần kiểm tra sau.
 */
export async function archiveIfEnded() {
  try {
    const peek = await EventSetting.findOne({ key: 'main' }, 'closesAt endHandledAt').lean();
    if (!peek?.closesAt || peek.endHandledAt || peek.closesAt > new Date()) return;
    await withArchiveLock(async () => {
      const ev = await EventSetting.findOne({ key: 'main' });
      if (!ev || ev.endHandledAt || !ev.closesAt || ev.closesAt > new Date()) return;
      const snap = await snapshot(null, 'auto_end');
      ev.archivedId = snap?.archive._id || null;
      ev.endHandledAt = new Date();
      await ev.save();
      await AuditLog.create({
        action: 'event.auto_archive',
        actorCode: null,
        actorRole: null,
        detail: String(
          snap ? `Hết giờ, tự lưu "${ev.eventName}" vào lịch sử (${snap.archive.summary.checked} lượt)` : `Hết giờ "${ev.eventName}", không có ai điểm danh nên không lưu`
        ).slice(0, 300),
      });
    });
  } catch (err) {
    console.error('Không tự lưu được lịch sử sự kiện:', err.message); // 409 khi đang bận cũng vào đây, lần sau thử lại
  }
}
