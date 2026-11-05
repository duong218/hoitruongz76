import { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/attendanceService.js';

export function useAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await attendanceService.getAttendance();
      setAttendance(list);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu điểm danh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();

    // Nghe sự kiện storage giữa các tab
    const handleStorageChange = (e) => {
      if (e.key === 'z176_v2_attendance' || e.key === null) {
        fetchAttendance();
      }
    };

    // Nghe sự kiện trong cùng tab
    const handleLocalUpdate = () => {
      fetchAttendance();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('z176_attendance_updated', handleLocalUpdate);
    window.addEventListener('z176_data_reset', handleLocalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('z176_attendance_updated', handleLocalUpdate);
      window.removeEventListener('z176_data_reset', handleLocalUpdate);
    };
  }, [fetchAttendance]);

  const checkIn = async ({ seatId, token }) => {
    const res = await attendanceService.checkIn({ seatId, token });
    await fetchAttendance();
    return res;
  };

  const resetAttendance = async () => {
    await attendanceService.resetAttendance();
    await fetchAttendance();
  };

  return {
    attendance,
    loading,
    error,
    refresh: fetchAttendance,
    checkIn,
    resetAttendance,
  };
}
