import React, { useEffect, useMemo, useState } from 'react';
import { seatService } from '../../services/seatService.js';
import { CountUp } from '../../components/ui/CountUp.jsx';
import { Link } from 'react-router-dom';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { TOTAL_SEATS } from '../../constants/hall.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { SeatInfoTip, buildSeatTip } from '../../components/hall/SeatInfoTip.jsx';
import { Armchair, UserCheck } from 'lucide-react';

const pct = (n, d) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0);

function Bar({ value, color, label }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden"
    >
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

const linkBtn =
  'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008BC5] focus-visible:ring-offset-2';

export function ManagerDashboardPage() {
  const { groups } = useGroups();
  const { seatGroups: groupSeats, refresh: refreshSeats } = useSeatAssignments();
  const { event, refresh: refreshEvent } = useEventSettings();
  const { employees, refresh: refreshEmployees } = useEmployees();
  const { attendance, refresh: refreshAttendance } = useAttendance();
  const [personal, setPersonal] = useState([]);
  const individual = event.seatMode === 'individual';

  // Tự cập nhật: tải lại mỗi 10s và khi quay lại tab (poll nhẹ, ponytail: đổi sang SSE nếu cần tức thì)
  useEffect(() => {
    const load = () => {
      refreshEvent(); refreshSeats(); refreshEmployees(); refreshAttendance();
      if (individual) seatService.getPersonal().then(setPersonal).catch(() => {});
    };
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 10000);
    document.addEventListener('visibilitychange', load);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, [individual]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chế độ từng người: ghế -> nhóm của người ngồi ghế đó
  const seatGroups = useMemo(() => {
    if (!individual) return groupSeats;
    const byCode = new Map(employees.map((e) => [e.code?.toUpperCase(), e]));
    return Object.fromEntries(personal.map((s) => [s.seatId, resolveGroup(byCode.get(s.employeeCode?.toUpperCase()), groups)?.id]).filter(([, g]) => g));
  }, [individual, groupSeats, personal, employees, groups]);

  const assignedSeatCount = Object.keys(seatGroups).length;
  const freeSeatCount = TOTAL_SEATS - assignedSeatCount;
  const seatPct = pct(assignedSeatCount, TOTAL_SEATS);

  // Số ghế / số người / số người đã điểm danh theo từng nhóm + tổng cần điểm danh
  const { seatsOf, peopleOf, requiredCount, checkedInCount } = useMemo(() => {
    const seatsOf = {};
    Object.values(seatGroups).forEach((gId) => (seatsOf[gId] = (seatsOf[gId] || 0) + 1));

    const codes = new Set(attendance.map((a) => a.employeeCode.toUpperCase()));
    const peopleOf = {};
    let requiredCount = 0;
    let checkedInCount = 0;
    employees.forEach((emp) => {
      const g = resolveGroup(emp, groups);
      if (!g) return;
      const p = (peopleOf[g.id] ||= { total: 0, checked: 0 });
      const done = codes.has(emp.code.toUpperCase());
      p.total++;
      if (done) p.checked++;
      if (g.checkInRequired) {
        requiredCount++;
        if (done) checkedInCount++;
      }
    });
    return { seatsOf, peopleOf, requiredCount, checkedInCount };
  }, [seatGroups, employees, groups, attendance]);

  const checkPct = pct(checkedInCount, requiredCount);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Tiêu đề + hành động chính */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] leading-tight">Tổng quan vận hành</h1>
          <p className="text-[15px] text-[#475569] mt-1">
            {event.eventName || 'Hội trường Z176'} · {TOTAL_SEATS} ghế
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/manager/attendance"
            className={`${linkBtn} bg-white text-[#334155] border border-[#CBD5E1] hover:bg-[#F6F8FA]`}
          >
            <UserCheck className="w-5 h-5" />
            Xem điểm danh
          </Link>
          <Link to="/manager/seating" className={`${linkBtn} bg-[#008BC5] text-white hover:bg-[#0072A3]`}>
            <Armchair className="w-5 h-5" />
            Chỉnh sửa sắp chỗ
          </Link>
        </div>
      </div>

      {/* Dải chỉ số: 1 khối, ngăn bằng đường kẻ mảnh */}
      <section
        aria-label="Chỉ số vận hành"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
      >
        <div className="bg-white p-5 space-y-3">
          <span className="text-[14px] font-semibold text-[#475569]">Ghế đã sắp</span>
          <p className="h-10 flex items-end gap-1.5 tabular-nums">
            <span className="text-[32px] font-bold leading-none text-[#0F172A]"><CountUp value={assignedSeatCount} /></span>
            <span className="text-[18px] font-semibold leading-6 text-[#475569]">/ {TOTAL_SEATS}</span>
          </p>
          <Bar value={seatPct} color="#008BC5" label="Tỷ lệ ghế đã sắp" />
          <p className="text-[14px] text-[#475569]">
            {seatPct}% · còn trống <strong className="text-[#0F172A]">{freeSeatCount}</strong> ghế
          </p>
        </div>

        <div className="bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#475569]">Điểm danh</span>
            <span
              className={`text-[13px] font-bold px-2 py-0.5 rounded ${
                event.checkInOpen ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#FEECEC] text-[#B91C1C]'
              }`}
            >
              {event.checkInOpen ? 'Đang mở' : 'Đang đóng'}
            </span>
          </div>
          <p className="h-10 flex items-end gap-1.5 tabular-nums">
            <span className="text-[32px] font-bold leading-none text-[#0F172A]"><CountUp value={checkedInCount} /></span>
            <span className="text-[18px] font-semibold leading-6 text-[#475569]">/ {requiredCount} người</span>
          </p>
          <Bar value={checkPct} color="#16A34A" label="Tỷ lệ đã điểm danh" />
          <p className="text-[14px] text-[#475569]">
            {requiredCount ? `${checkPct}% đại biểu cần điểm danh` : 'Chưa có nhóm nào yêu cầu điểm danh'}
          </p>
        </div>

        <div className="bg-white p-5 space-y-3">
          <span className="text-[14px] font-semibold text-[#475569]">Số nhóm ghế</span>
          <p className="h-10 flex items-end text-[32px] font-bold leading-none text-[#0F172A] tabular-nums">
            <CountUp value={groups.length} />
          </p>
          <p className="text-[14px] text-[#475569] pt-[14px]">Bao gồm Khách mời</p>
        </div>

        <div className="bg-white p-5 space-y-3">
          <span className="text-[14px] font-semibold text-[#475569]">Khách mời</span>
          <p
            className={`h-10 flex items-end gap-2 text-[24px] font-bold leading-none ${
              event.guestEnabled ? 'text-[#15803D]' : 'text-[#475569]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 mb-1.5 rounded-full ${event.guestEnabled ? 'bg-[#22C55E]' : 'bg-[#94A3B8]'}`}
            />
            {event.guestEnabled ? 'Đang bật' : 'Đang tắt'}
          </p>
          <p className="text-[14px] text-[#475569] pt-[14px]">
            {event.guestEnabled ? 'Cho phép nhập tên' : 'Chỉ nhận mã nhân viên'}
          </p>
        </div>
      </section>

      {/* Sơ đồ + bảng nhóm: 2 cột trên màn hình rộng để không phải cuộn */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <section className="space-y-3 min-w-0">
          <div>
            <h2 className="text-[18px] font-bold text-[#0F172A]">Sơ đồ phân bổ chỗ ngồi</h2>
            <p className="text-[14px] text-[#475569]">Hiện trạng các khối trên sơ đồ 2D hội trường.</p>
          </div>
          <HallMap
            mode="manage"
            seatGroups={seatGroups}
            groups={groups}
            renderSeatTip={(id) => {
              const ownerCode = personal.find((s) => s.seatId === id)?.employeeCode;
              const nameOf = new Map(employees.map((e) => [e.code?.toUpperCase(), e.name]));
              const d = buildSeatTip({ seatId: id, ownerCode, nameOf, attendance });
              return d && <SeatInfoTip data={d} />;
            }}
          />
        </section>

        <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-5">
          <h2 className="text-[18px] font-bold text-[#0F172A]">Nhóm ghế</h2>
          <p className="text-[14px] text-[#475569]">Màu trùng với màu trên sơ đồ.</p>

          {groups.length === 0 ? (
            <p className="mt-4 text-[15px] text-[#475569]">Chưa có nhóm nào. Hãy tạo nhóm trước khi sắp chỗ.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#E2E8F0]">
              {groups.map((g) => {
                const seats = seatsOf[g.id] || 0;
                const p = peopleOf[g.id] || { total: 0, checked: 0 };
                return (
                  <li key={g.id} className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                        style={{ background: g.color }}
                      />
                      <span className="flex-1 min-w-0 truncate text-[15px] font-semibold text-[#0F172A]">{g.name}</span>
                      {seats ? (
                        <span className="text-[15px] font-bold text-[#0F172A] tabular-nums">{seats} ghế</span>
                      ) : (
                        <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">Chưa sắp ghế</span>
                      )}
                    </div>
                    <p className="pl-6 text-[14px] text-[#475569] tabular-nums">
                      {p.total} người
                      {g.checkInRequired ? ` · ${p.checked}/${p.total} đã điểm danh` : ' · không cần điểm danh'}
                    </p>
                  </li>
                );
              })}
              <li className="py-3 flex items-center gap-2.5">
                <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full shrink-0 bg-[#E2E8F0] border border-black/10" />
                <span className="flex-1 text-[15px] font-semibold text-[#475569]">Chưa gán</span>
                <span className="text-[15px] font-bold text-[#475569] tabular-nums">{freeSeatCount} ghế</span>
              </li>
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}