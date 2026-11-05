import mongoose from 'mongoose';
import { cleanJSON, NAME_COLLATION } from './_clean.js';

const blockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, toJSON: cleanJSON(['createdAt', 'updatedAt']) }
);

blockSchema.index({ name: 1 }, { unique: true, collation: NAME_COLLATION });

export const Block = mongoose.model('Block', blockSchema);
