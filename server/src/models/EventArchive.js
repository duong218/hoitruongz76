import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';

// Bản chụp sự kiện đã kết thúc. Chỉ thêm, không có API sửa/xóa (dấu vết kiểm toán).
// Lưu TÊN/KHỐI/PHÒNG/NHÓM tại thời điểm chụp để sau này đổi tên hay xóa nhân viên cũng không làm sai lịch sử.
const rowSchema = new mongoose.Schema(
  {
    code: String,
    name: String,
    block: String,
    dept: String,
    group: String,
    required: Boolean, // thuộc nhóm bắt buộc điểm danh tại thời điểm chụp
    checked: Boolean,
    seatId: String,
    checkedInAt: Date,
    method: String,
    checkedInBy: String,
    reason: String,
  },
  { _id: false }
);

const archiveSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    startedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: Date.now },
    archivedBy: { type: String, default: '' }, // mã người bấm
    cause: { type: String, enum: ['reset', 'start_new', 'auto_end'], required: true },
    summary: { required: Number, checked: Number, proxy: Number },
    rows: { type: [rowSchema], default: [] },
  },
  {
    timestamps: false,
    // cleanJSON bỏ _id mà bảng này không có trường id riêng, nên gắn id = _id để client mở được từng sự kiện
    toJSON: { transform: (doc, ret) => ({ ...cleanJSON().transform(doc, ret), id: String(doc._id) }) },
  }
);
archiveSchema.index({ archivedAt: -1 });

export const EventArchive = mongoose.model('EventArchive', archiveSchema);
