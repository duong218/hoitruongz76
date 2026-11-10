import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';
import { SEAT_ID_REGEX } from '../constants/hall.server.js';
import { seatTaken, scheduleRebuild } from '../utils/seatEvents.js';

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

// Ghế nào có người điểm danh thì báo ngay cho những người đang xem sơ đồ (xem utils/seatEvents.js).
// Đặt ở model để mọi đường ghi/xóa (quét, điểm danh hộ, đặt lại, lưu trữ) đều được tính, không sót chỗ nào.
attendanceSchema.post('save', (doc) => seatTaken(doc.seatId));
attendanceSchema.post(
  ['deleteMany', 'deleteOne', 'findOneAndDelete', 'findOneAndUpdate', 'updateOne', 'updateMany'],
  () => scheduleRebuild()
);

export const Attendance = mongoose.model('Attendance', attendanceSchema);
