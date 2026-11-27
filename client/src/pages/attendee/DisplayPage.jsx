import React, { useEffect, useState } from 'react';
import { Users, Armchair, Clock, Maximize2 } from 'lucide-react';
import api from '../../services/api.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { TOTAL_SEATS } from '../../constants/hall.js';

export function DisplayPage() {
  const { event, refresh: refreshEvent } = useEventSettings();
  const { groups, refresh: refreshGroups } = useGroups();
  const { seatGroups, refresh: refreshSeats } = useSeatAssignments();
  const [stats, setStats] = useState({ requiredCount: 0, checkedInCount: 0, occupiedSeats: [], personalSeatGroups: {} });
  const [now, setNow] = useState(() => new Date());

  const loadLive = async () => {
    try {
      const data = await api.get('/event/live-stats');
      setStats(data);
    } catch {
      // giữ nguyên số liệu cũ nếu mạng chập chờn
    }
  };

  useEffect(() => {
    loadLive();
    const dataTimer = setInterval(() => {
      loadLive();
      refreshEvent();
      refreshGroups();
      refreshSeats();
    }, 5000);
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displaySeatGroups = event.seatMode === 'individual'
    ? { ...seatGroups, ...(stats.personalSeatGroups || {}) }
    : seatGroups;
  const pct = stats.requiredCount ? Math.min(100, Math.round((stats.checkedInCount / stats.requiredCount) * 100)) : 0;
  const assignedCount = Object.keys(displaySeatGroups).length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8FAFC] text-[#0F172A] p-3 sm:p-4 flex flex-col gap-3">
      {/* Header trình chiếu */}
      <header className="shrink-0 bg-white border border-[#E2E8F0] rounded-2xl px-5 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#008BC5]">
            Hội trường Z176 · Màn hình trực tiếp
          </p>
          <h1 className="text-[20px] sm:text-[24px] font-extrabold leading-tight">
            {event.eventName || 'Sự kiện Hội trường Z176'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#EAF6FF] border border-[#BAE6FD] px-3.5 py-2 rounded-xl">
            <Users className="w-5 h-5 text-[#008BC5]" />
            <div>
              <p className="text-[11px] font-bold uppercase text-[#0369A1]">Quân số có mặt</p>
              <p className="text-[18px] font-extrabold text-[#0F172A] leading-none">
                {stats.checkedInCount}/{stats.requiredCount}{' '}
                <span className="text-[#008BC5]">({pct}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#F1F5F9] px-3.5 py-2 rounded-xl">
            <Armchair className="w-5 h-5 text-[#475569]" />
            <div>
              <p className="text-[11px] font-bold uppercase text-[#64748B]">Ghế đã phân</p>
              <p className="text-[18px] font-extrabold text-[#0F172A] leading-none">
                {assignedCount}/{TOTAL_SEATS}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[16px] font-mono font-bold text-[#334155] px-2">
            <Clock className="w-4 h-4 text-[#64748B]" />
            {now.toLocaleTimeString('vi-VN')}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toàn màn hình"
            className="p-2 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#475569] cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sơ đồ 200 ghế vừa khít chiều cao màn hình + Chú thích bên phải */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center">
          <HallMap
            mode="manage"
            seatGroups={displaySeatGroups}
            groups={groups}
            occupiedSeats={new Set(stats.occupiedSeats || [])}
            className="h-full w-full flex items-center justify-center [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:max-w-full"
          />
        </div>

        {/* Chú thích màu nhóm */}
        <aside className="shrink-0 lg:w-60 bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-row lg:flex-col flex-wrap gap-3 lg:overflow-y-auto">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#64748B] w-full">
            Chú thích khu vực
          </span>
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2.5 text-[14px] font-semibold text-[#0F172A]">
              <span className="w-4 h-4 rounded-md shrink-0" style={{ backgroundColor: g.color }} />
              <span className="leading-snug">{g.name}</span>
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}
