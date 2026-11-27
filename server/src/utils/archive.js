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
  const records = await Attendance.findAll();
  if (!records.length) return null;

  const [event, employees, groups, blocks, depts] = await Promise.all([
    EventSetting.getMain(),
    Employee.findAll(),
    Group.findAll(),
    Block.findAll(),
    Department.findAll(),
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

  return { archive, codes: records.map((r) => r.employeeCode) };
}

export async function archiveAndClear(req, cause) {
  const ev = await EventSetting.getMain();
  if (ev?.archivedId) {
    const existing = await EventArchive.findById(ev.archivedId);
    const allAtt = await Attendance.findAll();
    if (existing && existing.summary.checked === allAtt.length) {
      await Attendance.deleteAll();
      return existing;
    }
  }
  const snap = await snapshot(req, cause);
  if (!snap) return null;
  for (const code of snap.codes) {
    await Attendance.deleteByEmployeeCode(code);
  }
  return snap.archive;
}

export async function archiveIfEnded() {
  try {
    const peek = await EventSetting.getMain();
    if (!peek?.closesAt || peek.endHandledAt || peek.closesAt > new Date()) return;
    await withArchiveLock(async () => {
      const ev = await EventSetting.getMain();
      if (!ev || ev.endHandledAt || !ev.closesAt || ev.closesAt > new Date()) return;
      const snap = await snapshot(null, 'auto_end');
      await EventSetting.upsertMain({
        archivedId: snap?.archive.id || null,
        endHandledAt: new Date(),
      });
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
    console.error('Không tự lưu được lịch sử sự kiện:', err.message);
  }
}
