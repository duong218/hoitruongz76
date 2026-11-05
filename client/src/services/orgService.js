import api from './api.js';

export const orgService = {
  // ================= KHỐI (BLOCKS) =================
  async getBlocks() {
    return await api.get('/org/blocks');
  },

  async addBlock(data) {
    return await api.post('/org/blocks', data);
  },

  async updateBlock(id, data) {
    return await api.put(`/org/blocks/${id}`, data);
  },

  async deleteBlock(id) {
    return await api.delete(`/org/blocks/${id}`);
  },

  // ================= PHÒNG BAN (DEPARTMENTS) =================
  async getDepartments() {
    return await api.get('/org/departments');
  },

  async addDepartment(data) {
    return await api.post('/org/departments', data);
  },

  async updateDepartment(id, data) {
    return await api.put(`/org/departments/${id}`, data);
  },

  async deleteDepartment(id) {
    return await api.delete(`/org/departments/${id}`);
  },
};
