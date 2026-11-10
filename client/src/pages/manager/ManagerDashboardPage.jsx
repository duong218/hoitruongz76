import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Armchair, UserCheck, AlertTriangle, Clock, Users, CheckCircle2, ChevronRight, UserPlus } from 'lucide-react';
import { seatService } from '../../services/seatService.js';
import { CountUp } from '../../components/ui/CountUp.jsx';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { TOTAL_SEATS } from '../../constants/hall.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { findDuplicateSeats } from '../../utils/attendanceInsights.js';
import { seatLabel } from '../../utils/seatLabel.js';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { SeatInfoTip, buildSeatTip } from '../../components/hall/SeatInfoTip.jsx';

const pct = (n, d) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0);
const hhmm = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

const card = 'bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]';
const eyebrow = 'text-[12px] font-bold uppercase tracking-[0.08em] text-[#64748B]';

/** Vòng tròn tiến độ */
function Ring({ value, size = 96, stroke = 10, color = '#16A34A', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function Bar({ value, color, label, h = 'h-2' }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={`${h} rounded-full bg-[#EEF2F6] overflow-hidden`}>
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  );
}

export function ManagerDashboardPage() {
  const { groups } = useGroups();
  const { seatGroups: groupSeats, refresh: refreshSeats } = useSeatAssignments();
  const { event, refresh: refreshEvent } = useEventSettings();
  const { employees, refresh: refreshEmployees } = useEmployees();
  const { attendance, refresh: refreshAttendance } = useAttendance();
  const [personal, setPersonal] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const individual = event.seatMode === 'individual';

  // Tự cập nhật: tải lại mỗi 10s và khi quay lại tab (poll nhẹ, ponytail: đổi sang SSE nếu cần tức thì)
  useEffect(() => {
    const load = () => {
      refreshEvent(); refreshSeats(); refreshEmployees(); refreshAttendance();
      if (individual) seatService.getPersonal().then(setPersonal).catch(() => {});
      setUpdatedAt(new Date());
    };
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 10000);
    document.addEventListener('visibilitychange', load);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', load); };
  }, [individual]); // eslint-disable-line react-hooks/exhaustive-deps

  const byCode = useMemo(() => new Map(employees.map((e) => [e.code?.toUpperCase(), e])), [employees]);
  const nameOf = useMemo(() => new Map(employees.map((e) => [e.code?.toUpperCase(), e.name])), [employees]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

  // Chế độ từng người: ghế -> nhóm của người ngồi ghế đó (ghế khách mời gán theo nhóm được giữ nguyên)
  const seatGroups = useMemo(() => {
    if (!individual) return groupSeats;
    return { ...groupSeats, ...Object.fromEntries(personal.map((s) => [s.seatId, resolveGroup(byCode.get(s.employeeCode?.toUpperCase()), groups)?.id]).filter(([, g]) => g)) };
  }, [individual, groupSeats, personal, byCode, groups]);

  const assignedSeatCount = Object.keys(seatGroups).length;
  const freeSeatCount = TOTAL_SEATS - assignedSeatCount;
  const seatPct = pct(assignedSeatCount, TOTAL_SEATS);

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
  const waiting = Math.max(0, requiredCount - checkedInCount);
  const dupSeats = useMemo(() => findDuplicateSeats(attendance), [attendance]);
  const recent = useMemo(() => [...attendance].sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt)).slice(0, 8), [attendance]);

  const renderTip = (id) => {
    const ownerCode = personal.find((s) => s.seatId === id)?.employeeCode;
    const d = buildSeatTip({ seatId: id, ownerCode, nameOf, attendance });
    return d && <SeatInfoTip data={d} />;
  };

  return (
    <div className="space-y-6 max-w-[1680px]">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl px-8 py-7 text-white shadow-[0_20px_40px_-20px_rgba(11,27,51,0.6)]" style={{ background: 'linear-gradient(120deg,#0B1B33 0%,#0F3558 55%,#0A6EA1 120%)' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle,#38BDF8,transparent 70%)' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" /></span>
                Trực tiếp · cập nhật {updatedAt.toLocaleTimeString('vi-VN')}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">{individual ? 'Xếp chỗ từng người' : 'Xếp chỗ theo nhóm'}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Khách mời: {event.guestEnabled ? 'đang bật' : 'đang tắt'}</span>
            </div>
            <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-tight">{event.eventName || 'Hội trường Z176'}</h1>
            <p className="mt-1 text-[16px] text-white/70">Tổng quan vận hành · {TOTAL_SEATS} ghế · {employees.length} nhân sự</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/manager/attendance" className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-white/10 px-5 text-[15px] font-semibold backdrop-blur transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <UserCheck className="h-5 w-5" /> Xem điểm danh
            </Link>
            <Link to="/manager/seating" className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-bold text-[#0B1B33] transition hover:bg-[#E0F2FE] focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Armchair className="h-5 w-5" /> Chỉnh sửa sắp chỗ
            </Link>
          </div>
        </div>
      </section>

      {/* Chỉ số */}
      <section aria-label="Chỉ số vận hành" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${card} flex items-center gap-5 p-6`}>
          <Ring value={checkPct}>
            <span className="text-[22px] font-extrabold tabular-nums text-[#0F172A]">{checkPct}%</span>
          </Ring>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={eyebrow}>Điểm danh</span>
              <span className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${event.checkInOpen ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#FEECEC] text-[#B91C1C]'}`}>{event.checkInOpen ? 'Đang mở' : 'Đang đóng'}</span>
            </div>
            <p className="mt-1 flex items-baseline gap-1.5 tabular-nums"><span className="text-[36px] font-extrabold leading-none text-[#0F172A]"><CountUp value={checkedInCount} /></span><span className="text-[17px] font-semibold text-[#64748B]">/ {requiredCount} người</span></p>
          </div>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Ghế đã sắp</span><Armchair className="h-5 w-5 text-[#008BC5]" /></div>
          <p className="mt-2 flex items-baseline gap-1.5 tabular-nums"><span className="text-[36px] font-extrabold leading-none text-[#0F172A]"><CountUp value={assignedSeatCount} /></span><span className="text-[17px] font-semibold text-[#64748B]">/ {TOTAL_SEATS} ghế</span></p>
          <div className="mt-3"><Bar value={seatPct} color="linear-gradient(90deg,#008BC5,#38BDF8)" label="Tỷ lệ ghế đã sắp" /></div>
          <p className="mt-2 text-[14px] text-[#64748B]">{seatPct}% · còn trống <strong className="text-[#0F172A]">{freeSeatCount}</strong> ghế</p>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Chờ điểm danh</span><Clock className="h-5 w-5 text-[#D97706]" /></div>
          <p className="mt-2 flex items-baseline gap-1.5 tabular-nums"><span className="text-[36px] font-extrabold leading-none text-[#0F172A]"><CountUp value={waiting} /></span><span className="text-[17px] font-semibold text-[#64748B]">người</span></p>
          <p className="mt-3 text-[14px] text-[#64748B]">{requiredCount ? (waiting ? 'Chưa có mặt tại hội trường' : 'Mọi người đã có mặt') : 'Chưa có nhóm nào yêu cầu điểm danh'}</p>
        </div>

        <Link to="/manager/attendance" className={`${card} group p-6 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.25)] ${dupSeats.size ? 'border-[#FCA5A5] bg-[#FFF5F5]' : ''}`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Trùng ghế</span>{dupSeats.size ? <AlertTriangle className="h-5 w-5 text-[#DC2626]" /> : <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />}</div>
          <p className={`mt-2 flex items-baseline gap-1.5 tabular-nums ${dupSeats.size ? 'text-[#B91C1C]' : 'text-[#0F172A]'}`}><span className="text-[36px] font-extrabold leading-none"><CountUp value={dupSeats.size} /></span><span className="text-[17px] font-semibold opacity-70">ghế</span></p>
          <p className="mt-3 flex items-center gap-1 text-[14px] text-[#64748B]">{dupSeats.size ? 'Nhiều người điểm danh cùng ghế' : 'Không có ghế nào bị trùng'}{dupSeats.size > 0 && <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}</p>
        </Link>
      </section>

      {/* Sơ đồ + cột phải */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
        <section className={`${card} min-w-0 p-6`}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-extrabold text-[#0F172A]">Sơ đồ chỗ ngồi</h2>
              <p className="text-[14px] text-[#64748B]">Rê chuột vào ghế khoảng 1,5 giây để xem người ngồi và giờ điểm danh.</p>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#334155]">
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: g.color }} />{g.name}<span className="font-bold tabular-nums text-[#94A3B8]">{seatsOf[g.id] || 0}</span>
                </li>
              ))}
              <li className="flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B]"><span className="h-3 w-3 rounded-full border border-black/10 bg-[#E2E8F0]" />Chưa gán<span className="font-bold tabular-nums text-[#94A3B8]">{freeSeatCount}</span></li>
            </ul>
          </div>
          <HallMap mode="manage" seatGroups={seatGroups} groups={groups} renderSeatTip={renderTip} className="!border-0 !shadow-none !p-0 bg-[#F8FAFC] rounded-2xl" />
        </section>

        <div className="space-y-6">
          <section className={`${card} p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-extrabold text-[#0F172A]">Nhóm ghế</h2>
              <Link to="/manager/groups" className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#008BC5] hover:underline">Quản lý <ChevronRight className="h-4 w-4" /></Link>
            </div>
            {groups.length === 0 ? (
              <p className="mt-4 text-[15px] text-[#475569]">Chưa có nhóm nào. Hãy tạo nhóm trước khi sắp chỗ.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {groups.map((g) => {
                  const seats = seatsOf[g.id] || 0;
                  const p = peopleOf[g.id] || { total: 0, checked: 0 };
                  const v = pct(p.checked, p.total);
                  return (
                    <li key={g.id}>
                      <div className="flex items-center gap-2.5">
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ background: g.color }} />
                        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#0F172A]">{g.name}</span>
                        {seats ? <span className="text-[14px] font-bold tabular-nums text-[#334155]">{seats} ghế</span> : <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[12px] font-bold text-[#92400E]">Chưa sắp ghế</span>}
                      </div>
                      <div className="mt-2 pl-6">
                        {g.checkInRequired ? <Bar value={v} color={g.color} label={`Điểm danh ${g.name}`} h="h-1.5" /> : <div className="h-1.5 rounded-full bg-[repeating-linear-gradient(45deg,#EEF2F6,#EEF2F6_6px,#F8FAFC_6px,#F8FAFC_12px)]" />}
                        <p className="mt-1 flex justify-between text-[13px] tabular-nums text-[#64748B]"><span><Users className="mr-1 inline h-3.5 w-3.5" />{p.total} người</span><span>{g.checkInRequired ? `${p.checked}/${p.total} đã điểm danh` : 'không cần điểm danh'}</span></p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={`${card} p-6`}>
            <h2 className="text-[18px] font-extrabold text-[#0F172A]">Điểm danh gần đây</h2>
            {recent.length === 0 ? (
              <p className="mt-4 text-[15px] text-[#64748B]">Chưa có ai điểm danh.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#EEF2F6]">
                {recent.map((a) => {
                  const emp = byCode.get(a.employeeCode.toUpperCase());
                  const g = groupById.get(resolveGroup(emp, groups)?.id);
                  const dup = a.seatId && dupSeats.has(a.seatId);
                  return (
                    <li key={a.employeeCode} className="flex items-center gap-3 py-2.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-extrabold text-white" style={{ background: g?.color || '#64748B' }}>{initials(emp?.name || a.employeeCode)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-[#0F172A]">{emp?.name || a.employeeCode} <span className="font-mono text-[12px] font-medium text-[#94A3B8]">{a.employeeCode}</span></p>
                        <p className="truncate text-[13px] text-[#64748B]">{a.seatId ? seatLabel(a.seatId) : 'Không gán ghế'}{a.method === 'PROXY' && <span className="ml-2 rounded bg-[#EEF2FF] px-1.5 py-0.5 text-[11px] font-bold text-[#4338CA]"><UserPlus className="mr-0.5 inline h-3 w-3" />Điểm danh hộ</span>}{dup && <span className="ml-2 rounded bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-bold text-[#B91C1C]">Trùng ghế</span>}</p>
                      </div>
                      <span className="text-[14px] font-bold tabular-nums text-[#334155]">{hhmm(a.checkedInAt)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}