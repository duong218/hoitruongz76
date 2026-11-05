import api from './api.js';

// Token ghế chỉ quản trị mới lấy được; người tham dự chỉ nhận cài đặt công khai.
async function withTokens(event) {
  if (!localStorage.getItem('z176_v2_staff_session')) return { ...event, seatTokens: {} };
  try {
    const { seatTokens } = await api.get('/event/tokens');
    return { ...event, seatTokens };
  } catch {
    return { ...event, seatTokens: {} };
  }
}

export const eventService = {
  async getEventSettings() {
    return withTokens(await api.get('/event'));
  },

  async updateEventSettings(updates) {
    const updated = await withTokens(await api.put('/event', updates));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_event_updated', { detail: updated }));
    }
    return updated;
  },
};
