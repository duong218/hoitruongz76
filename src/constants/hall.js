export const TOTAL_ROWS = 10;
export const SEATS_PER_SIDE = 10;
export const TOTAL_SEATS_PER_ROW = SEATS_PER_SIDE * 2; // 20
export const TOTAL_SEATS = TOTAL_ROWS * TOTAL_SEATS_PER_ROW; // 200
export const VIP_ROWS = [1, 2];

export const GROUP_COLOR_PALETTE = [
  { id: 'red', hex: '#E53E3E', label: 'Đỏ' },
  { id: 'yellow-orange', hex: '#F6AD37', label: 'Vàng cam' },
  { id: 'blue', hex: '#008BC5', label: 'Xanh dương' },
  { id: 'green', hex: '#22C55E', label: 'Xanh lá' },
  { id: 'purple', hex: '#7C3AED', label: 'Tím' },
  { id: 'pink', hex: '#DB2777', label: 'Hồng' },
  { id: 'teal', hex: '#0F766E', label: 'Xanh ngọc' },
  { id: 'dark-gray', hex: '#475569', label: 'Xám đậm' },
];

/**
 * Tạo seatId dạng "3-L-5"
 * @param {number} row - Số hàng (1..10)
 * @param {'L'|'R'} side - Bên Trái (L) hoặc Bên Phải (R)
 * @param {number} n - Số ghế (1..10), 1 sát lối đi, 10 sát tường
 * @returns {string}
 */
export function seatId(row, side, n) {
  return `${row}-${side}-${n}`;
}

/**
 * Phân tích seatId thành các phần tử
 * @param {string} id
 * @returns {{ row: number, side: 'L'|'R', n: number } | null}
 */
export function parseSeatId(id) {
  if (!id) return null;
  const parts = id.split('-');
  if (parts.length !== 3) return null;
  return {
    row: parseInt(parts[0], 10),
    side: parts[1],
    n: parseInt(parts[2], 10),
  };
}

/**
 * Lấy danh sách 20 seatId của 1 hàng
 * @param {number} row
 * @returns {string[]}
 */
export function rowSeatIds(row) {
  const ids = [];
  // Left side: 1..10
  for (let n = 1; n <= SEATS_PER_SIDE; n++) {
    ids.push(seatId(row, 'L', n));
  }
  // Right side: 1..10
  for (let n = 1; n <= SEATS_PER_SIDE; n++) {
    ids.push(seatId(row, 'R', n));
  }
  return ids;
}

/**
 * Kiểm tra xem hàng có phải là hàng VIP không
 * @param {number} row
 * @returns {boolean}
 */
export function isVipRow(row) {
  return VIP_ROWS.includes(row);
}
