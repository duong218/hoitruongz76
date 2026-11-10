import { useEffect, useState } from 'react';
import api from '../services/api.js';

// Giữ danh sách ghế đã có người điểm danh luôn mới, không cần tải lại trang:
// - Server đẩy từng sự kiện qua SSE (nhẹ: không ai phải gọi lại server mỗi lần có người quét).
// - Mỗi sự kiện có số phiên bản liên tục; thấy hụt số (mất mạng, tắt màn hình) thì tải lại bản chụp 1 lần.
// - Mỗi lần (nối lại) và khi mở lại màn hình đều tải bản chụp, có trễ ngẫu nhiên <0,8s để 200 máy không dồn cùng lúc.

/**
 * Áp một tin từ server lên trạng thái hiện tại.
 * @param {{ v: number, seats: Set<string> }} state v = -1 nghĩa là chưa có bản chụp
 * @param {{ type: string, v: number, seatId?: string, seats?: string[] }} msg
 * @returns {{ state: object, reload: boolean }} reload = true khi cần tải lại bản chụp
 */
export function applySeatMessage(state, msg) {
  if (state.v < 0) return { state, reload: false }; // bản chụp tới sau sẽ gồm luôn tin này
  if (!msg || typeof msg.v !== 'number' || msg.v <= state.v) return { state, reload: false };
  if (msg.type === 'reset') return { state: { v: msg.v, seats: new Set(msg.seats) }, reload: false };
  if (msg.type === 'seat') {
    if (msg.v !== state.v + 1) return { state, reload: true }; // hụt tin
    return { state: { v: msg.v, seats: new Set(state.seats).add(msg.seatId) }, reload: false };
  }
  return { state, reload: false };
}

/** @returns {Set<string>} các mã ghế đã có người điểm danh, tự cập nhật theo thời gian thực */
export function useOccupiedSeats() {
  const [seats, setSeats] = useState(() => new Set());

  useEffect(() => {
    let state = { v: -1, seats: new Set() };
    let source = null;
    let loadTimer = null;
    let retryTimer = null;
    let loading = false;
    let stopped = false;

    const apply = (next) => {
      state = next;
      setSeats(next.seats);
    };

    const load = async () => {
      if (loading || stopped) return;
      loading = true;
      try {
        const { v, seats: ids } = await api.get('/seats/occupied');
        if (!stopped && v >= state.v) apply({ v, seats: new Set(ids) });
      } catch {
        /* giữ bản cũ, lần nối lại hoặc mở lại màn hình sẽ tải lại */
      } finally {
        loading = false;
      }
    };
    const loadSoon = () => {
      clearTimeout(loadTimer);
      loadTimer = setTimeout(load, Math.random() * 800);
    };

    const connect = () => {
      source = new EventSource(`${api.defaults.baseURL}/seats/stream`);
      source.onopen = loadSoon; // lần đầu và mỗi lần nối lại
      source.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data);
        } catch {
          return;
        }
        const { state: next, reload } = applySeatMessage(state, msg);
        if (next !== state) apply(next);
        if (reload) loadSoon();
      };
      source.onerror = () => {
        // Rớt kết nối tạm thời: trình duyệt tự nối lại. Bị server từ chối hẳn (503/502) thì phải tự tạo lại.
        if (source.readyState === 2) {
          source.close();
          clearTimeout(retryTimer);
          retryTimer = setTimeout(connect, 5000 + Math.random() * 5000);
        }
      };
    };

    if (typeof EventSource === 'undefined') {
      load(); // trình duyệt quá cũ: chỉ lấy một lần
    } else {
      connect();
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') loadSoon(); // điện thoại sáng màn hình lại: bù tin đã lỡ
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearTimeout(loadTimer);
      clearTimeout(retryTimer);
      document.removeEventListener('visibilitychange', onVisible);
      source?.close();
    };
  }, []);

  return seats;
}
