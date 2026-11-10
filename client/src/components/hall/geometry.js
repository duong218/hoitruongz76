import { SEATS_PER_SIDE, parseSeatId } from '../../constants/hall.js';

export const HALL_LAYOUT = {
  VIEW_WIDTH: 940,
  VIEW_HEIGHT: 750,
  STAGE: {
    x: 320,
    y: 20,
    width: 300,
    height: 40,
  },
  ENTRANCE: {
    x: 400,
    y: 685,
    width: 140,
    height: 40,
    centerX: 470,
    topY: 685,
  },
  ROW_START_Y: 92,
  ROW_HEIGHT: 30,
  ROW_GAP: 25,
  SEAT_WIDTH: 28,
  SEAT_HEIGHT: 26,
  SEAT_SPACING: 4,
  // Tọa độ khối ghế bên Trái (Seat 10 sát tường, Seat 1 sát lối đi)
  LEFT_START_X: 105,
  // Lối đi giữa x = 422 đến 518 (tâm x = 470)
  RIGHT_START_X: 520,
};

/**
 * Lấy tọa độ Y của một hàng (1..10)
 * @param {number} row
 * @returns {number}
 */
export function getRowY(row) {
  const index = row - 1;
  return HALL_LAYOUT.ROW_START_Y + index * (HALL_LAYOUT.ROW_HEIGHT + HALL_LAYOUT.ROW_GAP);
}

/**
 * Lấy tọa độ X, Y của 1 ghế
 * Ghế 1 là sát lối đi, Ghế 10 là sát tường.
 * @param {number} row
 * @param {'L'|'R'} side
 * @param {number} n (1..10)
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function getSeatCoords(row, side, n) {
  const y = getRowY(row) + 2;
  const step = HALL_LAYOUT.SEAT_WIDTH + HALL_LAYOUT.SEAT_SPACING; // 32px

  let x = 0;
  if (side === 'L') {
    // n = 10 ở ngoài cùng bên trái (x = LEFT_START_X)
    // n = 1 ở sát lối đi bên phải (x = LEFT_START_X + 9 * step)
    const offsetIndex = 10 - n;
    x = HALL_LAYOUT.LEFT_START_X + offsetIndex * step;
  } else {
    // side === 'R'
    // n = 1 ở sát lối đi bên trái (x = RIGHT_START_X)
    // n = 10 ở ngoài cùng bên phải (x = RIGHT_START_X + 9 * step)
    const offsetIndex = n - 1;
    x = HALL_LAYOUT.RIGHT_START_X + offsetIndex * step;
  }

  return {
    x,
    y,
    width: HALL_LAYOUT.SEAT_WIDTH,
    height: HALL_LAYOUT.SEAT_HEIGHT,
  };
}

/**
 * Tính toán khung bao (halo bounding box) cho một chuỗi ghế thuộc hàng & phía nhất định
 * @param {number} row
 * @param {'L'|'R'} side
 * @param {number[]} seatNumbers - mảng số ghế (ví dụ [6, 7, 8, 9, 10])
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
export function getSegmentHalo(row, side, seatNumbers) {
  if (!seatNumbers || seatNumbers.length === 0) return null;
  const coordsList = seatNumbers.map((n) => getSeatCoords(row, side, n));
  const minX = Math.min(...coordsList.map((c) => c.x));
  const maxX = Math.max(...coordsList.map((c) => c.x + c.width));
  const minY = Math.min(...coordsList.map((c) => c.y));
  const maxY = Math.max(...coordsList.map((c) => c.y + c.height));

  const padding = 4;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
    midX: (minX + maxX) / 2,
    bottomY: maxY + padding,
  };
}

/**
 * Tạo đường dẫn SVG từ cửa vào tới hàng ghế được chỉ định gần cửa nhất
 * @param {number} targetRow - Hàng số lớn nhất có ghế của nhóm
 * @param {boolean} hasLeftSeats - Bên trái có ghế không
 * @param {boolean} hasRightSeats - Bên phải có ghế không
 * @param {number} leftMidX - Tọa độ tâm X của đoạn ghế bên trái
 * @param {number} rightMidX - Tọa độ tâm X của đoạn ghế bên phải
 * @returns {string[]} Danh sách d attribute cho các đường nét đứt
 */
export function getEntrancePathData(targetRow, hasLeftSeats, hasRightSeats, leftMidX, rightMidX) {
  const startX = HALL_LAYOUT.ENTRANCE.centerX; // 470
  const startY = HALL_LAYOUT.ENTRANCE.topY; // 685

  const rowY = getRowY(targetRow);
  // Điểm rẽ ngang nằm ở khoảng trống TRƯỚC hàng ghế (phía sân khấu), rồi mũi tên chỉ XUỐNG hàng ghế.
  // Hàng 1 sát dãy số ghế nên rẽ cao hơn một chút để không đè lên số.
  const turnY = rowY - (targetRow === 1 ? 19 : 16);
  const targetArrowY = rowY - 8;

  const paths = [];

  // Nếu có ghế bên trái
  if (hasLeftSeats && leftMidX) {
    // Đi từ cửa lên đến turnY (trước hàng ghế), rẽ trái sang leftMidX, rồi đi xuống targetArrowY
    paths.push(`M ${startX} ${startY} L ${startX} ${turnY} L ${leftMidX} ${turnY} L ${leftMidX} ${targetArrowY}`);
  }

  // Nếu có ghế bên phải
  if (hasRightSeats && rightMidX) {
    // Đi từ cửa lên đến turnY (trước hàng ghế), rẽ phải sang rightMidX, rồi đi xuống targetArrowY
    paths.push(`M ${startX} ${startY} L ${startX} ${turnY} L ${rightMidX} ${turnY} L ${rightMidX} ${targetArrowY}`);
  }

  // Trường hợp dự phòng nếu không xác định được bên
  if (paths.length === 0) {
    paths.push(`M ${startX} ${startY} L ${startX} ${turnY}`);
  }

  return paths;
}
