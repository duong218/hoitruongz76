import { useState, useEffect, useCallback } from 'react';
import { seatService } from '../services/seatService.js';

export function useSeatAssignments() {
  const [seatGroups, setSeatGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await seatService.getSeatAssignments();
      setSeatGroups(data);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu ghế.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeats();

    const handleReset = () => fetchSeats();
    window.addEventListener('z176_data_reset', handleReset);
    return () => window.removeEventListener('z176_data_reset', handleReset);
  }, [fetchSeats]);

  const assignSeats = async (seatIds, groupId) => {
    const updated = await seatService.assignSeats(seatIds, groupId);
    setSeatGroups({ ...updated });
    return updated;
  };

  const assignRows = async (rowNumbers, groupId) => {
    const updated = await seatService.assignRows(rowNumbers, groupId);
    setSeatGroups({ ...updated });
    return updated;
  };

  const unassignSeats = async (seatIds) => {
    const updated = await seatService.unassignSeats(seatIds);
    setSeatGroups({ ...updated });
    return updated;
  };

  const unassignRows = async (rowNumbers) => {
    const updated = await seatService.unassignRows(rowNumbers);
    setSeatGroups({ ...updated });
    return updated;
  };

  return {
    seatGroups,
    loading,
    error,
    refresh: fetchSeats,
    assignSeats,
    assignRows,
    unassignSeats,
    unassignRows,
  };
}
