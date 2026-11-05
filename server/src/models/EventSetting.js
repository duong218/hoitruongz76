import mongoose from 'mongoose';
import { cleanJSON } from './_clean.js';

// Chỉ có 1 bản ghi duy nhất (key = 'main')
const eventSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true, immutable: true },
    eventName: { type: String, required: true, trim: true },
    guestEnabled: { type: Boolean, default: true },
    checkInOpen: { type: Boolean, default: true },
    appUrl: { type: String, default: '', trim: true },
  },
  { timestamps: true, toJSON: cleanJSON(['key', 'createdAt', 'updatedAt']) }
);

export const EventSetting = mongoose.model('EventSetting', eventSettingSchema);
