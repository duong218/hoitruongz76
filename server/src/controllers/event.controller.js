import { EventSetting, Seat } from '../models/index.js';
import { audit } from '../utils/audit.js';

export const eventController = {
  // Cài đặt sự kiện (công khai). KHÔNG chứa token ghế.
  async getSettings(req, res, next) {
    try {
      let event = await EventSetting.findOne({ key: 'main' });
      if (!event) {
        event = await EventSetting.create({
          key: 'main',
          eventName: 'Hội nghị Triển khai Nhiệm vụ Z176',
          guestEnabled: true,
          checkInOpen: true,
          appUrl: '',
        });
      }
      res.json(event.toJSON());
    } catch (err) {
      next(err);
    }
  },

  // Token ghế (chỉ ADMIN / MANAGER, dùng để in QR)
  async getSeatTokens(req, res, next) {
    try {
      const seats = await Seat.find().select('+token');
      const seatTokens = {};
      seats.forEach((s) => {
        seatTokens[s.seatId] = s.token;
      });
      res.json({ seatTokens });
    } catch (err) {
      next(err);
    }
  },

  // Cập nhật cài đặt sự kiện
  async updateSettings(req, res, next) {
    try {
      const { eventName, guestEnabled, checkInOpen, appUrl } = req.body;
      let event = await EventSetting.findOne({ key: 'main' });
      if (!event) {
        event = new EventSetting({ key: 'main' });
      }

      if (eventName !== undefined) event.eventName = eventName.trim();
      if (guestEnabled !== undefined) event.guestEnabled = guestEnabled;
      if (checkInOpen !== undefined) event.checkInOpen = checkInOpen;
      if (appUrl !== undefined) event.appUrl = appUrl.trim();

      await event.save();
      const parts = [];
      if (eventName !== undefined) parts.push('đổi tên sự kiện');
      if (guestEnabled !== undefined) parts.push(`khách mời=${guestEnabled ? 'bật' : 'tắt'}`);
      if (checkInOpen !== undefined) parts.push(`điểm danh=${checkInOpen ? 'mở' : 'đóng'}`);
      if (appUrl !== undefined) parts.push('đổi đường dẫn');
      await audit(req, 'event.update', `Cập nhật sự kiện: ${parts.join(', ') || 'không đổi gì'}`);
      res.json(event.toJSON());
    } catch (err) {
      next(err);
    }
  },
};
