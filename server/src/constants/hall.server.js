// Giữ giống client/src/constants/hall.js
export const TOTAL_ROWS = 10;
export const SEATS_PER_SIDE = 10;

// seatId dạng "3-L-5": hàng 1..10, bên L/R, số ghế 1..10
export const SEAT_ID_REGEX = /^(10|[1-9])-(L|R)-(10|[1-9])$/;

export function seatId(row, side, n) {
  return `${row}-${side}-${n}`;
}

export function rowSeatIds(row) {
  const ids = [];
  for (let n = 1; n <= SEATS_PER_SIDE; n++) ids.push(seatId(row, 'L', n));
  for (let n = 1; n <= SEATS_PER_SIDE; n++) ids.push(seatId(row, 'R', n));
  return ids;
}

export function allSeatIds() {
  const ids = [];
  for (let row = 1; row <= TOTAL_ROWS; row++) ids.push(...rowSeatIds(row));
  return ids;
}
