import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';
import { ROLES } from '../constants/roles.server.js';

const employeeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE], default: ROLES.EMPLOYEE },
    departmentId: { type: String, default: null }, // trỏ tới Department.id
    blockId: { type: String, default: null }, // trỏ tới Block.id
    // Chỉ ADMIN / MANAGER có. select:false nên mặc định không bao giờ được đọc ra.
    passwordHash: { type: String, select: false },
  },
  { timestamps: true, toJSON: cleanJSON(['passwordHash', 'createdAt', 'updatedAt']) }
);

export const Employee = mongoose.model('Employee', employeeSchema);
