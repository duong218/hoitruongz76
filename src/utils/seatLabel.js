import { parseSeatId } from '../constants/hall.js';

/**
 * Tạo nhãn vị trí ghế dạng câu tự nhiên
 * @param {string} seatId - ví dụ "5-L-3"
 * @returns {string} ví dụ "Hàng 5, bên trái, ghế 3"
 */
export function seatLabel(seatId) {
  const parsed = parseSeatId(seatId);
  if (!parsed) return seatId || 'Chưa rõ ghế';

  const sideText = parsed.side === 'L' ? 'bên trái' : 'bên phải';
  return `Hàng ${parsed.row}, ${sideText}, ghế ${parsed.n}`;
}

/**
 * Tạo nhãn in ngắn gọn cho tờ dán ghế và bảng chi tiết
 * @param {string} seatId - ví dụ "5-L-3"
 * @returns {string} ví dụ "Hàng 5 - Trái - Ghế 3"
 */
export function seatBadgeText(seatId) {
  const parsed = parseSeatId(seatId);
  if (!parsed) return seatId || '—';

  const sideText = parsed.side === 'L' ? 'Trái' : 'Phải';
  return `Hàng ${parsed.row} - ${sideText} - Ghế ${parsed.n}`;
}
