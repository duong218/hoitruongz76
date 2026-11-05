import api from './api.js';

export const groupService = {
  async getGroups() {
    return await api.get('/groups');
  },

  async getGroupUsage(groupId) {
    return await api.get(`/groups/${groupId}/usage`);
  },

  async addGroup(groupData) {
    return await api.post('/groups', groupData);
  },

  async updateGroup(id, groupData) {
    return await api.put(`/groups/${id}`, groupData);
  },

  async deleteGroup(id) {
    return await api.delete(`/groups/${id}`);
  },
};
