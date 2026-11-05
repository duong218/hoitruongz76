import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/employeeService.js';

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách nhân viên.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();

    const handleReset = () => fetchEmployees();
    window.addEventListener('z176_data_reset', handleReset);
    return () => window.removeEventListener('z176_data_reset', handleReset);
  }, [fetchEmployees]);

  const addEmployee = async (empData) => {
    const created = await employeeService.addEmployee(empData);
    await fetchEmployees();
    return created;
  };

  const updateEmployee = async (code, empData) => {
    const updated = await employeeService.updateEmployee(code, empData);
    await fetchEmployees();
    return updated;
  };

  const deleteEmployee = async (code) => {
    await employeeService.deleteEmployee(code);
    await fetchEmployees();
  };

  const importEmployees = async (validRows) => {
    const result = await employeeService.importEmployees(validRows);
    await fetchEmployees();
    return result;
  };

  return {
    employees,
    loading,
    error,
    refresh: fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
  };
}
