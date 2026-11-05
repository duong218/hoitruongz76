import { useState, useEffect, useCallback } from 'react';
import { orgService } from '../services/orgService.js';

export function useOrg() {
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrgData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bList, dList] = await Promise.all([
        orgService.getBlocks(),
        orgService.getDepartments(),
      ]);
      setBlocks(bList);
      setDepartments(dList);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu cơ cấu tổ chức.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgData();

    const handleReset = () => fetchOrgData();
    window.addEventListener('z176_data_reset', handleReset);
    return () => window.removeEventListener('z176_data_reset', handleReset);
  }, [fetchOrgData]);

  const addBlock = async (data) => {
    const res = await orgService.addBlock(data);
    await fetchOrgData();
    return res;
  };

  const updateBlock = async (id, data) => {
    const res = await orgService.updateBlock(id, data);
    await fetchOrgData();
    return res;
  };

  const deleteBlock = async (id) => {
    await orgService.deleteBlock(id);
    await fetchOrgData();
  };

  const addDepartment = async (data) => {
    const res = await orgService.addDepartment(data);
    await fetchOrgData();
    return res;
  };

  const updateDepartment = async (id, data) => {
    const res = await orgService.updateDepartment(id, data);
    await fetchOrgData();
    return res;
  };

  const deleteDepartment = async (id) => {
    await orgService.deleteDepartment(id);
    await fetchOrgData();
  };

  return {
    blocks,
    departments,
    loading,
    error,
    refresh: fetchOrgData,
    addBlock,
    updateBlock,
    deleteBlock,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
