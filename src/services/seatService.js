// MERN: thay bằng axios gọi /api/seats
import { INITIAL_SEAT_GROUPS } from '../data/mockData.js';
import { rowSeatIds } from '../constants/hall.js';

const STORAGE_KEY_SEATS = 'z176_v2_seats';

function getStoredSeats() {
  const raw = localStorage.getItem(STORAGE_KEY_SEATS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_SEATS, JSON.stringify(INITIAL_SEAT_GROUPS));
    return { ...INITIAL_SEAT_GROUPS };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_SEAT_GROUPS };
  }
}

function saveSeats(seats) {
  localStorage.setItem(STORAGE_KEY_SEATS, JSON.stringify(seats));
}

export const seatService = {
  async getSeatAssignments() {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return getStoredSeats();
  },

  async assignSeats(seatIds, groupId) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const seats = getStoredSeats();

    seatIds.forEach((sId) => {
      if (!groupId) {
        delete seats[sId];
      } else {
        seats[sId] = groupId;
      }
    });

    saveSeats(seats);
    return seats;
  },

  async assignRows(rowNumbers, groupId) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const allSeatIds = [];
    rowNumbers.forEach((row) => {
      allSeatIds.push(...rowSeatIds(row));
    });
    return this.assignSeats(allSeatIds, groupId);
  },

  async unassignSeats(seatIds) {
    return this.assignSeats(seatIds, null);
  },

  async unassignRows(rowNumbers) {
    return this.assignRows(rowNumbers, null);
  },
};
