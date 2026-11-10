import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../services/eventService.js';

export function useEventSettings() {
  const [event, setEvent] = useState({
    eventName: '',
    guestEnabled: true,
    checkInOpen: true,
    seatMode: 'group',
    appUrl: '',
    seatTokens: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getEventSettings();
      setEvent(data);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải thông tin sự kiện.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvent();

    const handleReset = () => fetchEvent();
    const handleUpdate = (e) => {
      if (e?.detail) {
        setEvent(e.detail);
      } else {
        fetchEvent();
      }
    };

    window.addEventListener('z176_data_reset', handleReset);
    window.addEventListener('z176_event_updated', handleUpdate);
    return () => {
      window.removeEventListener('z176_data_reset', handleReset);
      window.removeEventListener('z176_event_updated', handleUpdate);
    };
  }, [fetchEvent]);

  const updateEvent = async (updates) => {
    const updated = await eventService.updateEventSettings(updates);
    setEvent(updated);
    return updated;
  };

  const startNewEvent = async (eventName, opensAt, closesAt, options) => {
    const updated = await eventService.startNewEvent(eventName, opensAt, closesAt, options);
    setEvent(updated);
    return updated;
  };

  return {
    startNewEvent,
    event,
    loading,
    error,
    refresh: fetchEvent,
    updateEvent,
  };
}