import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';
import { SEAT_ID_REGEX } from '../constants/hall.server.js';

const seatSchema = new mongoose.Schema(
  {
    seatId: { type: String, required: true, unique: true, match: SEAT_ID_REGEX }, // "3-L-5"
    groupId: { type: String, default: null }, // trỏ tới Group.id, rỗng = chưa gán
    // Token dán trên ghế (QR). select:false: chỉ đọc khi thật sự cần (in tem, kiểm tra điểm danh).
    token: { type: String, required: true, select: false },
  },
  { timestamps: true, toJSON: cleanJSON(['token', 'createdAt', 'updatedAt']) }
);

export const Seat = mongoose.model('Seat', seatSchema);
