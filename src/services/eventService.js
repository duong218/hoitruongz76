// MERN: thay bằng axios gọi /api/event
import { INITIAL_EVENT, INITIAL_SEAT_TOKENS } from '../data/mockData.js';

const STORAGE_KEY_EVENT = 'z176_v2_event';

function getStoredEvent() {
  const defaultUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login`
    : 'http://localhost:3000/login';

  const base = { ...INITIAL_EVENT, appUrl: defaultUrl };
  const raw = localStorage.getItem(STORAGE_KEY_EVENT);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_EVENT, JSON.stringify(base));
    return base;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.appUrl) {
      parsed.appUrl = defaultUrl;
    }
    if (!parsed.seatTokens || Object.keys(parsed.seatTokens).length === 0) {
      parsed.seatTokens = INITIAL_SEAT_TOKENS;
    }
    if (parsed.checkInOpen === undefined) {
      parsed.checkInOpen = true;
    }
    if (parsed.guestEnabled === undefined) {
      parsed.guestEnabled = true;
    }
    return parsed;
  } catch {
    return base;
  }
}

function saveEvent(event) {
  localStorage.setItem(STORAGE_KEY_EVENT, JSON.stringify(event));
}

export const eventService = {
  async getEventSettings() {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return getStoredEvent();
  },

  async updateEventSettings(updates) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const current = getStoredEvent();
    const updated = {
      ...current,
      ...updates,
    };
    saveEvent(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('z176_event_updated', { detail: updated }));
    }
    return updated;
  },
};
