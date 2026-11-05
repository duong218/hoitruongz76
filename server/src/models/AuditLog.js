import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';

// Nhật ký thao tác: chỉ thêm, không sửa, không xóa qua API
const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true }, // ví dụ: attendance.reset
    actorCode: { type: String, default: null }, // mã người thực hiện (lấy từ phiên đăng nhập)
    actorRole: { type: String, default: null },
    detail: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: cleanJSON() }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
