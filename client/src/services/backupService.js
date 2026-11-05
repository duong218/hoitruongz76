import api from './api.js';

export const backupService = {
  /**
   * Xuất toàn bộ dữ liệu từ server ra file JSON
   */
  async exportBackup() {
    const [blocks, departments, employees, groups, seats, event, attendance] = await Promise.all([
      api.get('/org/blocks'),
      api.get('/org/departments'),
      api.get('/employees'),
      api.get('/groups'),
      api.get('/seats'),
      api.get('/event'),
      api.get('/attendance'),
    ]);

    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      data: {
        blocks,
        departments,
        employees,
        groups,
        seats,
        event,
        attendance,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.download = `z176-sao-luu-${ymd}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Khôi phục dữ liệu từ nội dung file JSON
   * @param {string} jsonString
   */
  async restoreBackup(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Tệp không đúng định dạng JSON hợp lệ.');
    }

    if (!parsed || !parsed.data) {
      throw new Error('Cấu trúc file sao lưu không hợp lệ, thiếu mục dữ liệu chính.');
    }

    const { employees } = parsed.data;
    if (Array.isArray(employees) && employees.length > 0) {
      await api.post('/employees/import', { rows: employees });
    }
    window.dispatchEvent(new Event('z176_data_reset'));
  },

  /**
   * Đặt lại toàn bộ dữ liệu
   */
  async resetToDemoData() {
    // Có thể gọi endpoint seed hoặc reset điểm danh
    await api.post('/attendance/reset');
    window.dispatchEvent(new Event('z176_data_reset'));
  },
};
