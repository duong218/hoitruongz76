import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';
import { SEAT_ID_REGEX } from '../constants/hall.server.js';

const seatSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true, unique: true, match: SEAT_ID_REGEX }, // "3-L-5"
    groupId: { type: String, default: null }, // trỏ tới Group.id, rỗng = chưa gán
    employeeCode: { type: String, default: null, uppercase: true }, // chế độ 'individual': ghế dành riêng cho 1 người
    // Token dán trên ghế (QR). select:false: chỉ đọc khi thật sự cần (in tem, kiểm tra điểm danh).
    token: { type: String, required: true, select: false },
  },
  { timestamps: true, toJSON: cleanJSON(['token', 'createdAt', 'updatedAt']) }
);

// Đánh chỉ mục token để tối ưu tra cứu ghế tức thì (O(1)) khi hàng trăm người quét QR cùng lúc
seatSchema.index({ token: 1 });

export const Seat = mongoose.model('Seat', seatSchema);
