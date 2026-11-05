import { randomInt } from 'node:crypto';

// Bỏ các ký tự dễ nhầm: I, O, 0, 1
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Token ngẫu nhiên thật (crypto), khác với mockData ở client vốn tính ra được từ công thức
export function generateSeatToken(length = 6) {
  let token = '';
  for (let i = 0; i < length; i++) {
    token += ALPHABET[randomInt(ALPHABET.length)];
  }
  return token;
}
