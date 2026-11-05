import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';
import { SEAT_ID_REGEX } from '../constants/hall.server.js';

const attendanceSchema = new mongoose.Schema(
  {
    // unique: mỗi người chỉ điểm danh một lần
    employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    seatId: { type: String, required: true, match: SEAT_ID_REGEX },
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: false, toJSON: cleanJSON() }
);

export const Attendance = mongoose.model('Attendance', attendanceSchema);
