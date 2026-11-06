import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';
import { SEAT_ID_REGEX } from '../constants/hall.server.js';

const attendanceSchema = new mongoose.Schema(
  {
    // unique: mỗi người chỉ điểm danh một lần
    employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    // Điểm danh hộ có thể không có ghế
    seatId: { type: String, default: '', validate: { validator: (v) => v === '' || SEAT_ID_REGEX.test(v) } },
    method: { type: String, enum: ['SELF', 'PROXY'], default: 'SELF' }, // bản ghi cũ coi là SELF
    checkedInBy: { type: String, default: '' }, // mã người bấm điểm danh hộ
    reason: { type: String, default: '', trim: true },
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: cleanJSON() }
);

export const Attendance = mongoose.model('Attendance', attendanceSchema);
