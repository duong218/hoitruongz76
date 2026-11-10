export const TOTAL_ROWS = 10;
export const SEATS_PER_SIDE = 10;
export const TOTAL_SEATS_PER_ROW = SEATS_PER_SIDE * 2; // 20
export const TOTAL_SEATS = TOTAL_ROWS * TOTAL_SEATS_PER_ROW; // 200
export const VIP_ROWS = [1, 2];

// Màu ghế của chính người điểm danh: đen, KHÔNG nằm trong bảng màu nhóm bên dưới (đừng thêm đen vào bảng)
export const MY_SEAT_COLOR = '#111827';
export const MY_SEAT_STROKE = '#000000';

export const GROUP_COLOR_PALETTE = [
  { id: 'red', hex: '#DC2626', label: 'Đỏ cờ' },
  { id: 'crimson', hex: '#E11D48', label: 'Đỏ hồng' },
  { id: 'orange', hex: '#EA580C', label: 'Cam đậm' },
  { id: 'amber', hex: '#D97706', label: 'Vàng hổ phách' },
  { id: 'yellow-orange', hex: '#F59E0B', label: 'Vàng cam' },
  { id: 'lime', hex: '#65A30D', label: 'Xanh chanh' },
  { id: 'green', hex: '#16A34A', label: 'Xanh lá cây' },
  { id: 'emerald', hex: '#059669', label: 'Xanh ngọc bích' },
  { id: 'teal', hex: '#0D9488', label: 'Xanh mòng két' },
  { id: 'cyan', hex: '#0891B2', label: 'Xanh lơ biển' },
  { id: 'blue', hex: '#0284C7', label: 'Xanh dương' },
  { id: 'indigo', hex: '#4F46E5', label: 'Xanh chàm' },
  { id: 'purple', hex: '#7C3AED', label: 'Tím đậm' },
  { id: 'fuchsia', hex: '#C026D3', label: 'Tím hoa cà' },
  { id: 'pink', hex: '#DB2777', label: 'Hồng sen' },
  { id: 'rose', hex: '#BE123C', label: 'Đỏ mận' },
  { id: 'slate', hex: '#475569', label: 'Xám đá phiến' },
  { id: 'zinc', hex: '#71717A', label: 'Ghi titan' },
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