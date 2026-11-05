import { useState, useEffect, useCallback } from 'react';
import { groupService } from '../services/groupService.js';

export function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách nhóm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();

    const handleReset = () => fetchGroups();
    window.addEventListener('z176_data_reset', handleReset);
    return () => window.removeEventListener('z176_data_reset', handleReset);
  }, [fetchGroups]);

  const addGroup = async (groupData) => {
    const newGroup = await groupService.addGroup(groupData);
    await fetchGroups();
    return newGroup;
  };

  const updateGroup = async (id, groupData) => {
    const updated = await groupService.updateGroup(id, groupData);
    await fetchGroups();
    return updated;
  };

  const deleteGroup = async (id) => {
    await groupService.deleteGroup(id);
    await fetchGroups();
  };

  const getGroupUsage = async (groupId) => {
    return await groupService.getGroupUsage(groupId);
  };

  return {
    groups,
    loading,
    error,
    refresh: fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupUsage,
  };
}
