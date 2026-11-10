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

  // Chế độ từng người: ghế của chính mình / danh sách (quản lý) / gán 1 người vào 1 ghế (seatId null = bỏ)
  async getMine() {
    return await api.get('/seats/mine');
  },

  async getPersonal() {
    return await api.get('/seats/personal');
  },

  async assignEmployee(employeeCode, seatId) {
    return await api.post('/seats/assign-employee', { employeeCode, seatId });
  },

  async unassignSeats(seatIds) {
    return this.assignSeats(seatIds, null);
  },

  async unassignRows(rowNumbers) {
    return this.assignRows(rowNumbers, null);
  },
};
