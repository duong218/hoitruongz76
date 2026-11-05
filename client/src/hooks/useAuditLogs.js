import { useState, useEffect, useCallback, useRef } from 'react';
import { auditService } from '../services/auditService.js';

const EMPTY = { items: [], total: 0, pages: 1 };

/**
 * Tải nhật ký theo tham số lọc; tự tải lại khi tham số đổi.
 * Bỏ qua kết quả của lần gọi cũ nếu đã có lần gọi mới hơn (tránh danh sách nhảy lung tung khi gõ nhanh).
 */
export function useAuditLogs(params) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const requestId = useRef(0);
  const key = JSON.stringify(params);

  const fetchLogs = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setError(null);
      const res = await auditService.getLogs(JSON.parse(key));
      if (id !== requestId.current) return;
      // Chịu được server cũ trả về mảng thuần
      setData(Array.isArray(res) ? { items: res, total: res.length, pages: 1 } : res);
      setUpdatedAt(new Date());
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message || 'Không tải được nhật ký.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { items: data.items, total: data.total, pages: data.pages, loading, error, updatedAt, refresh: fetchLogs };
}
