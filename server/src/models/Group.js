import mongoose from 'mongoose';
import { cleanJSON, NAME_COLLATION } from './_clean.js';

const groupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true }, // mã hex, ví dụ #E53E3E
    isSystem: { type: Boolean, default: false }, // nhóm "Khách mời" là nhóm hệ thống
    checkInRequired: { type: Boolean, default: true },
    blockIds: { type: [String], default: [] }, // các Block.id thuộc nhóm này
  },
  { timestamps: true, toJSON: cleanJSON(['createdAt', 'updatedAt']) }
);

groupSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });

export const Group = mongoose.model('Group', groupSchema);
