// Giờ Việt Nam không có giờ mùa hè nên cộng cố định +7 là đủ để in giờ cho người đọc.
const vn = (d) => {
  const iso = new Date(d.getTime() + 7 * 3600 * 1000).toISOString();
  return `${iso.slice(11, 16)} ngày ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
};

/**
 * Người tham dự (nhân viên, khách mời) chỉ được vào trong khung giờ [opensAt, closesAt).
 * Trả về null nếu đang mở, ngược lại trả { code, message } để gửi về cho người dùng.
 * Chưa đặt đủ hai mốc giờ thì coi là chưa có sự kiện (quản lý vẫn xếp chỗ bình thường).
 */
export function eventGate(ev, now = new Date()) {
  if (!ev || !ev.opensAt || !ev.closesAt) {
    return { code: 'EVENT_NOT_SCHEDULED', message: 'Hiện chưa có sự kiện nào đang diễn ra. Vui lòng quay lại khi sự kiện bắt đầu.' };
  }
  if (now < ev.opensAt) {
    return { code: 'EVENT_NOT_STARTED', message: `Sự kiện chưa bắt đầu, sẽ mở lúc ${vn(ev.opensAt)}. Vui lòng chờ và quay lại sau.` };
  }
  if (now >= ev.closesAt) {
    return { code: 'EVENT_ENDED', message: 'Sự kiện đã kết thúc. Cảm ơn bạn đã quan tâm.' };
  }
  return null;
}

// Gửi phản hồi chặn. Đánh dấu để bộ giới hạn đăng nhập KHÔNG tính vào số lần thử sai.
export function sendGate(res, gate, status = 403) {
  res.locals.notCounted = true;
  return res.status(status).json(gate);
}