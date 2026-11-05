import api from './api.js';

export const auditService = {
  /**
   * Lấy nhật ký thao tác (chỉ Admin), mới nhất trước, có lọc và phân trang.
   * @param {{ action?: string, actor?: string, from?: string, to?: string, page?: number, limit?: number }} params
   * @returns {Promise<{ items: Array<{ id: string, action: string, actorCode: string|null, actorRole: string|null, detail: string, createdAt: string }>, total: number, page: number, limit: number, pages: number }>}
   */
  async getLogs(params = {}) {
    return await api.get('/audit', { params });
  },
};
