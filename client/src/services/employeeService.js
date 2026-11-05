import api from './api.js';

export const employeeService = {
  async getEmployees() {
    return await api.get('/employees');
  },

  async addEmployee(empData) {
    return await api.post('/employees', empData);
  },

  async updateEmployee(code, empData) {
    return await api.put(`/employees/${encodeURIComponent(code)}`, empData);
  },

  async deleteEmployee(code) {
    return await api.delete(`/employees/${encodeURIComponent(code)}`);
  },

  async importEmployees(validRows) {
    return await api.post('/employees/import', { rows: validRows });
  },
};
