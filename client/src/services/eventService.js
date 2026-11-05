import api from './api.js';

export const eventService = {
  async getEventSettings() {
    return await api.get('/event');
  },

  async updateEventSettings(updates) {
    const updated = await api.put('/event', updates);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_event_updated', { detail: updated }));
    }
    return updated;
  },
};
