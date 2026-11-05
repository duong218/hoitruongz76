import { EventSetting, Seat } from '../models/index.js';

export const eventController = {
  // Lấy cài đặt sự kiện & token ghế
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

      const seatsWithTokens = await Seat.find().select('+token');
      const seatTokens = {};
      seatsWithTokens.forEach((s) => {
        seatTokens[s.seatId] = s.token;
      });

      res.json({
        ...event.toJSON(),
        seatTokens,
      });
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

      const seatsWithTokens = await Seat.find().select('+token');
      const seatTokens = {};
      seatsWithTokens.forEach((s) => {
        seatTokens[s.seatId] = s.token;
      });

      res.json({
        ...event.toJSON(),
        seatTokens,
      });
    } catch (err) {
      next(err);
    }
  },
};

