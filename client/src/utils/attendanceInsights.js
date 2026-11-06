const hhmm = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/**
 * Ghế có từ 2 người khác nhau trở lên (trong sự kiện hiện tại, vì hệ thống chỉ giữ 1 sự kiện).
 * @returns {Map<string, Array>} seatId -> danh sách bản ghi trùng
 */
export function findDuplicateSeats(attendance) {
  const bySeat = new Map();
  attendance.forEach((a) => {
    if (!a.seatId) return; // điểm danh hộ không ghế thì không so trùng
    if (!bySeat.has(a.seatId)) bySeat.set(a.seatId, []);
    bySeat.get(a.seatId).push(a);
  });
  for (const [seat, list] of bySeat) {
    if (new Set(list.map((r) => r.employeeCode.toUpperCase())).size < 2) bySeat.delete(seat);
  }
  return bySeat;
}

/** Ghi chú chữ cho 1 bản ghi: dùng chung cho bảng và Excel. */
export function recordNotes(rec, dupSeats) {
  const dup = rec?.seatId ? dupSeats.get(rec.seatId) : null;
  const dupText = dup
    ? `TRÙNG GHẾ (${dup.length} người), cùng ghế với: ` +
      dup
        .filter((r) => r.employeeCode !== rec.employeeCode)
        .map((r) => `${r.employeeCode} (${hhmm(r.checkedInAt)})`)
        .join(', ')
    : '';
  const proxyText =
    rec?.method === 'PROXY'
      ? `ĐIỂM DANH HỘ, bởi ${rec.checkedInBy || '?'}, lý do: ${rec.reason || '—'}`
      : '';
  return { dupText, proxyText };
}
