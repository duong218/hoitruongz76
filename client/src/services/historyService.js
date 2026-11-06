import api from './api.js';

export const historyService = {
  list: () => api.get('/history'),
  get: (id) => api.get(`/history/${id}`),
  logExport: (id) => api.post(`/history/${id}/export-log`),
};
