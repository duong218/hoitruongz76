import { parseSeatId } from '../constants/hall.js';
import { ROLES, GUEST_GROUP_ID } from '../constants/roles.js';

export const CHECKIN_CODES = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  CLOSED: 'CLOSED',
  INVALID_QR: 'INVALID_QR',
  WRONG_SEAT: 'WRONG_SEAT',
  ALREADY: 'ALREADY',
  OK: 'OK',
};

/**
 * Kiểm tra tính hợp lệ khi người dùng thực hiện điểm danh tại ghế
 * @param {{
 *   user: object,
 *   group: object | null,
 *   seatGroups: Record<string, string>,
 *   seatId: string,
 *   token: string,
 *   event: { checkInOpen?: boolean, seatTokens?: Record<string, string> },
 *   attendance: Array<{ employeeCode: string, seatId: string, checkedInAt: string }>
 * }} params
 * @returns {{ ok: boolean, code: string, message: string, checkedInAt?: string }}
 */
export function validateCheckIn({
  user,
  group,
  seatGroups = {},
  seatId,
  token,
  event = {},
  attendance = [],
}) {
  // 1. Kiểm tra nhóm có yêu cầu điểm danh không
  if (
    !group ||
    group.checkInRequired === false ||
    group.id === GUEST_GROUP_ID ||
    user?.role === ROLES.GUEST ||
    user?.isGuest
  ) {
    return {
      ok: false,
      code: CHECKIN_CODES.NOT_REQUIRED,
      message: 'Nhóm của bạn không yêu cầu điểm danh.',
    };
  }

  // 2. Kiểm tra sự kiện đã mở điểm danh chưa
  if (!event.checkInOpen) {
    return {
      ok: false,
      code: CHECKIN_CODES.CLOSED,
      message: 'Chưa mở điểm danh. Vui lòng chờ ban tổ chức.',
    };
  }

  // 3. Kiểm tra mã ghế và token hợp lệ
  let targetSeatId = seatId;
  const upperToken = (token || '').trim().toUpperCase();

  // Nếu không truyền seatId nhưng có token, tìm seatId từ event.seatTokens
  if (!targetSeatId && upperToken && event.seatTokens) {
    const foundSeat = Object.entries(event.seatTokens).find(
      ([_, t]) => (t || '').trim().toUpperCase() === upperToken
    );
    if (foundSeat) {
      targetSeatId = foundSeat[0];
    }
  }

  const parsedSeat = targetSeatId ? parseSeatId(targetSeatId) : null;
  const expectedToken = targetSeatId && event.seatTokens ? event.seatTokens[targetSeatId] : null;

  if (
    !targetSeatId ||
    !parsedSeat ||
    parsedSeat.row < 1 ||
    parsedSeat.row > 10 ||
    parsedSeat.n < 1 ||
    parsedSeat.n > 10 ||
    !upperToken ||
    !expectedToken ||
    upperToken !== expectedToken.trim().toUpperCase()
  ) {
    return {
      ok: false,
      code: CHECKIN_CODES.INVALID_QR,
      message: 'Mã tem ghế không hợp lệ. Vui lòng kiểm tra lại 6 ký tự trên ghế.',
    };
  }

  // 4. Kiểm tra ghế có thuộc nhóm của người dùng không
  const assignedGroupId = seatGroups[targetSeatId];
  if (!assignedGroupId || assignedGroupId !== group.id) {
    return {
      ok: false,
      code: CHECKIN_CODES.WRONG_SEAT,
      message: `Ghế (${targetSeatId}) không thuộc khu vực của nhóm bạn. Hãy tới đúng hàng ghế được phân bổ.`,
    };
  }

  // 5. Kiểm tra người này đã điểm danh trước đó chưa
  const existingRecord = attendance.find(
    (a) => a.employeeCode?.toUpperCase() === user?.code?.toUpperCase()
  );

  if (existingRecord) {
    let timeStr = 'trước đó';
    try {
      const d = new Date(existingRecord.checkedInAt);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        timeStr = `${hours}:${mins}`;
      }
    } catch {
      timeStr = 'trước đó';
    }

    return {
      ok: false,
      code: CHECKIN_CODES.ALREADY,
      message: `Bạn đã điểm danh lúc ${timeStr} rồi.`,
      checkedInAt: existingRecord.checkedInAt,
      seatId: existingRecord.seatId,
    };
  }

  // 6. Hợp lệ
  return {
    ok: true,
    code: CHECKIN_CODES.OK,
    message: 'Điểm danh thành công.',
  };
}
