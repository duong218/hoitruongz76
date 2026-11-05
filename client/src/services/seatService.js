import api from './api.js';

export const seatService = {
  async getSeatAssignments() {
    return await api.get('/seats');
  },

  async assignSeats(seatIds, groupId) {
    return await api.post('/seats/assign-seats', { seatIds, groupId });
  },

  async assignRows(rowNumbers, groupId) {
    return await api.post('/seats/assign-rows', { rowNumbers, groupId });
  },

  async unassignSeats(seatIds) {
    return this.assignSeats(seatIds, null);
  },

  async unassignRows(rowNumbers) {
    return this.assignRows(rowNumbers, null);
  },
};
