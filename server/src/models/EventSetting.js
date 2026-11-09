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
    nameLocked: { type: Boolean, default: false }, // true sau khi bấm "Bắt đầu sự kiện mới"
    startedAt: { type: Date, default: null },
    // Khung giờ cho phép người tham dự vào (null = chưa đặt lịch = chưa mở cho ai)
    opensAt: { type: Date, default: null },
    closesAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: cleanJSON(['key', 'createdAt', 'updatedAt']) }
);

export const EventSetting = mongoose.model('EventSetting', eventSettingSchema);