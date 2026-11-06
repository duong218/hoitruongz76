import { EventSetting, Seat } from '../models/index.js';
import { audit } from '../utils/audit.js';
import { archiveAndClear, withArchiveLock } from '../utils/archive.js';

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

      if (eventName !== undefined && eventName.trim() !== event.eventName) {
        if (event.nameLocked) {
          return res.status(400).json({ message: 'Sự kiện đã bắt đầu nên không thể đổi tên. Hãy bấm \"Bắt đầu sự kiện mới\" nếu muốn tạo sự kiện khác.' });
        }
        event.eventName = eventName.trim();
      }
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

  // Bắt đầu sự kiện mới: xóa điểm danh sự kiện cũ, đặt tên mới và khóa tên.
  // Điểm danh cũ được lưu vào lịch sử (chỉ xem/xuất Excel), không điểm danh hộ được nữa.
  async startNew(req, res, next) {
    try {
      const name = (req.body.eventName || '').trim();
      if (!name) return res.status(400).json({ message: 'Vui lòng nhập tên sự kiện mới.' });
      const event = await withArchiveLock(async () => {
        let ev = await EventSetting.findOne({ key: 'main' });
        if (!ev) ev = new EventSetting({ key: 'main' });
        const oldName = ev.eventName;
        // Lưu lịch sử trước, xóa sau. Lưu lỗi thì ném lỗi, sự kiện cũ còn nguyên.
        const archived = await archiveAndClear(req, 'start_new');
        ev.eventName = name;
        ev.nameLocked = true;
        ev.startedAt = new Date();
        await ev.save();
        await audit(
          req,
          'event.start_new',
          `Bắt đầu sự kiện mới "${name}" (sự kiện trước "${oldName || ''}": ${archived ? `đã lưu lịch sử ${archived.summary.checked} lượt điểm danh` : 'không có ai điểm danh nên không lưu'})`
        );
        return ev;
      });
      res.json(event.toJSON());
    } catch (err) {
      next(err);
    }
  },
};
