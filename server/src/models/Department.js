import mongoose from 'mongoose';
import { cleanJSON, NAME_COLLATION } from './_clean.js';

const departmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    blockId: { type: String, required: true, trim: true }, // trỏ tới Block.id
  },
  { timestamps: true, toJSON: cleanJSON(['createdAt', 'updatedAt']) }
);

departmentSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });

export const Department = mongoose.model('Department', departmentSchema);
