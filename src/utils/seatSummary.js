/**
 * Gộp danh sách số nguyên liên tiếp thành các đoạn
 * @param {number[]} nums - Mảng số đã sắp xếp tăng dần
 * @returns {string} ví dụ "ghế 6-10" hoặc "ghế 1-3, 5, 8-10"
 */
export function formatSeatRanges(nums) {
  if (!nums || nums.length === 0) return '';
  if (nums.length === 10) return 'toàn bộ ghế 1-10';

  const ranges = [];
  let start = nums[0];
  let end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      ranges.push(start === end ? `ghế ${start}` : `ghế ${start}-${end}`);
      start = nums[i];
      end = nums[i];
    }
  }
  ranges.push(start === end ? `ghế ${start}` : `ghế ${start}-${end}`);

  return ranges.join(', ');
}

/**
 * Gộp danh sách seatId thành câu mô tả tự nhiên
 * @param {string[]} seatIds - Mảng các seatId dạng "3-L-5"
 * @returns {string} ví dụ "Hàng 3 (cả hàng), Hàng 8 (bên trái, ghế 6-10)"
 */
export function summarizeSeats(seatIds) {
  if (!seatIds || seatIds.length === 0) {
    return 'Chưa có chỗ';
  }

  // Phân tách theo hàng
  const rowMap = {};

  seatIds.forEach((sId) => {
    const parts = sId.split('-');
    if (parts.length === 3) {
      const row = parseInt(parts[0], 10);
      const side = parts[1]; // 'L' hoặc 'R'
      const n = parseInt(parts[2], 10);

      if (!rowMap[row]) {
        rowMap[row] = { L: [], R: [] };
      }
      rowMap[row][side].push(n);
    }
  });

  const rowNumbers = Object.keys(rowMap)
    .map(Number)
    .sort((a, b) => a - b);

  const rowPhrases = [];

  rowNumbers.forEach((row) => {
    const { L, R } = rowMap[row];
    L.sort((a, b) => a - b);
    R.sort((a, b) => a - b);

    // Kiểm tra xem có đủ cả 20 ghế của hàng không (10 bên trái và 10 bên phải)
    if (L.length === 10 && R.length === 10) {
      rowPhrases.push(`Hàng ${row} (cả hàng)`);
      return;
    }

    const sidePhrases = [];
    if (L.length > 0) {
      if (L.length === 10) {
        sidePhrases.push('cả bên trái');
      } else {
        sidePhrases.push(`bên trái, ${formatSeatRanges(L)}`);
      }
    }

    if (R.length > 0) {
      if (R.length === 10) {
        sidePhrases.push('cả bên phải');
      } else {
        sidePhrases.push(`bên phải, ${formatSeatRanges(R)}`);
      }
    }

    if (sidePhrases.length > 0) {
      rowPhrases.push(`Hàng ${row} (${sidePhrases.join('; ')})`);
    }
  });

  return rowPhrases.join(', ');
}
