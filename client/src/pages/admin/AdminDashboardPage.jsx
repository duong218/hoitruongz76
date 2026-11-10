import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GitFork, Building2, ShieldCheck, ArrowRight, Database, Armchair, UserCheck,
  AlertTriangle, CheckCircle2, ScrollText, ChevronRight,
} from 'lucide-react';
import { seatService } from '../../services/seatService.js';
import { CountUp } from '../../components/ui/CountUp.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { TOTAL_SEATS } from '../../constants/hall.js';

const pct = (n, d) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0);
const PALETTE = ['#008BC5', '#6366F1', '#16A34A', '#D97706', '#C026D3', '#0D9488', '#DC2626', '#475569'];

const card = 'bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]';
const eyebrow = 'text-[12px] font-bold uppercase tracking-[0.08em] text-[#64748B]';
const heroBtn = 'inline-flex min-h-[46px] items-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

function Ring({ value, size = 120, stroke = 12, color = '#008BC5', children }) {
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

const tools = [
  { to: '/admin/employees', icon: Users, title: 'Danh sách nhân sự', sub: 'Thêm, sửa, nhập file Excel', color: '#008BC5', bg: '#EAF6FF' },
  { to: '/admin/org', icon: GitFork, title: 'Cơ cấu tổ chức', sub: 'Quản lý khối và phòng ban', color: '#16A34A', bg: '#F0FDF4' },
  { to: '/admin/audit', icon: ScrollText, title: 'Nhật ký hệ thống', sub: 'Ai đã làm gì, lúc nào', color: '#6366F1', bg: '#EEF2FF' },
  { to: '/admin/maintenance', icon: Database, title: 'Bảo trì và sao lưu', sub: 'Xuất, khôi phục dữ liệu', color: '#DC2626', bg: '#FEECEC' },
];

export function AdminDashboardPage() {
  const { employees, loading: empLoading, refresh: refreshEmployees } = useEmployees();
  const { blocks, departments } = useOrg();
  const { groups } = useGroups();
  const { seatGroups, refresh: refreshSeats } = useSeatAssignments();
  const { attendance, refresh: refreshAttendance } = useAttendance();
  const { event } = useEventSettings();
  const [personal, setPersonal] = useState([]);
  const individual = event.seatMode === 'individual';

  // Số liệu hội trường tự cập nhật mỗi 10s (poll nhẹ)
  useEffect(() => {
    const load = () => {
      refreshEmployees(); refreshSeats(); refreshAttendance();
      if (individual) seatService.getPersonal().then(setPersonal).catch(() => {});
    };
    load();
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 10000);
    return () => clearInterval(t);
  }, [individual]); // eslint-disable-line react-hooks/exhaustive-deps

  const adminCount = employees.filter((e) => e.role === ROLES.ADMIN).length;
  const managerCount = employees.filter((e) => e.role === ROLES.MANAGER).length;
  const employeeCount = employees.filter((e) => e.role === ROLES.EMPLOYEE).length;
  const unassignedOrgCount = employees.filter((e) => !e.blockId || !e.departmentId).length;

  // Ghế đã sắp: theo nhóm + theo từng người (chế độ từng người), không đếm trùng
  const assignedSeats = useMemo(() => new Set([...Object.keys(seatGroups), ...personal.map((s) => s.seatId)]).size, [seatGroups, personal]);
  const seatPct = pct(assignedSeats, TOTAL_SEATS);

  const blockMap = useMemo(() => new Map(blocks.map((b) => [b.id, b.name])), [blocks]);
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  const blockDistribution = useMemo(
    () => blocks
      .map((b) => ({ id: b.id, name: b.name, count: employees.filter((e) => e.blockId === b.id).length }))
      .sort((a, b) => b.count - a.count)
      .map((b, i) => ({ ...b, pct: pct(b.count, employees.length), color: PALETTE[i % PALETTE.length] })),
    [blocks, employees]
  );
  const recentEmployees = useMemo(() => [...employees].slice(-6).reverse(), [employees]);

  return (
    <div className="mx-auto max-w-[1680px] space-y-6 pb-8">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-3xl px-8 py-7 text-white shadow-[0_20px_40px_-20px_rgba(11,27,51,0.6)]" style={{ background: 'linear-gradient(120deg,#0B1B33 0%,#0F3558 55%,#0A6EA1 120%)' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle,#38BDF8,transparent 70%)' }} />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[13px] font-semibold backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" /></span>
              Hệ thống Hội trường Z176 đang hoạt động
            </span>
            <h1 className="mt-3 text-[34px] font-extrabold leading-tight tracking-tight">Trung tâm quản trị hệ thống</h1>
            <p className="mt-1 max-w-2xl text-[16px] text-white/70">Nhân sự, cơ cấu tổ chức, sơ đồ {TOTAL_SEATS} ghế và an toàn dữ liệu, tất cả trong một màn hình.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/employees" className={`${heroBtn} bg-white font-bold text-[#0B1B33] hover:bg-[#E0F2FE]`}><Users className="h-5 w-5" /> Quản lý nhân sự</Link>
            <Link to="/admin/org" className={`${heroBtn} bg-white/10 backdrop-blur hover:bg-white/20`}><GitFork className="h-5 w-5" /> Cơ cấu tổ chức</Link>
            <Link to="/admin/maintenance" className={`${heroBtn} bg-white/10 backdrop-blur hover:bg-white/20`}><Database className="h-5 w-5" /> Sao lưu dữ liệu</Link>
          </div>
        </div>
      </section>

      {/* Chỉ số */}
      <section aria-label="Chỉ số hệ thống" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Tổng nhân sự</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF6FF] text-[#008BC5]"><Users className="h-5 w-5" /></span></div>
          <p className="mt-2 text-[38px] font-extrabold leading-none tabular-nums text-[#0F172A]">{empLoading ? '…' : <CountUp value={employees.length} />}</p>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-[#EEF2F6]" aria-hidden="true">
            <span style={{ width: `${pct(employeeCount, employees.length)}%`, background: '#008BC5' }} />
            <span style={{ width: `${pct(managerCount, employees.length)}%`, background: '#D97706' }} />
            <span style={{ width: `${pct(adminCount, employees.length)}%`, background: '#DC2626' }} />
          </div>
          <p className="mt-2 text-[13px] text-[#64748B]"><strong className="text-[#0F172A]">{employeeCount}</strong> nhân viên · {managerCount} quản lý · {adminCount} admin</p>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Cơ cấu tổ chức</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F0FDF4] text-[#16A34A]"><GitFork className="h-5 w-5" /></span></div>
          <div className="mt-2 flex items-end gap-6 tabular-nums">
            <p><span className="text-[38px] font-extrabold leading-none text-[#0F172A]"><CountUp value={blocks.length} /></span><span className="ml-1.5 text-[15px] font-semibold text-[#64748B]">khối</span></p>
            <p><span className="text-[38px] font-extrabold leading-none text-[#0F172A]"><CountUp value={departments.length} /></span><span className="ml-1.5 text-[15px] font-semibold text-[#64748B]">phòng ban</span></p>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-[#16A34A]"><Building2 className="h-4 w-4" />{groups.length} nhóm ghế hội trường đã thiết lập</p>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Tài khoản vận hành</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FEF9EE] text-[#D97706]"><ShieldCheck className="h-5 w-5" /></span></div>
          <p className="mt-2 text-[38px] font-extrabold leading-none tabular-nums text-[#0F172A]"><CountUp value={adminCount + managerCount} /></p>
          <p className="mt-4 text-[13px] text-[#64748B]"><strong className="text-[#B45309]">{adminCount}</strong> Admin · <strong className="text-[#B45309]">{managerCount}</strong> Quản lý</p>
        </div>

        <Link to="/admin/employees" className={`${card} group p-6 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(15,23,42,0.25)] ${unassignedOrgCount ? 'border-[#FDE68A] bg-[#FFFBEB]' : ''}`}>
          <div className="flex items-center justify-between"><span className={eyebrow}>Dữ liệu cần xử lý</span>{unassignedOrgCount ? <AlertTriangle className="h-5 w-5 text-[#D97706]" /> : <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />}</div>
          <p className={`mt-2 text-[38px] font-extrabold leading-none tabular-nums ${unassignedOrgCount ? 'text-[#B45309]' : 'text-[#0F172A]'}`}><CountUp value={unassignedOrgCount} /></p>
          <p className="mt-4 flex items-center gap-1 text-[13px] text-[#64748B]">{unassignedOrgCount ? 'Nhân sự thiếu khối hoặc phòng ban' : 'Mọi nhân sự đã đủ khối và phòng ban'}{unassignedOrgCount > 0 && <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}</p>
        </Link>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          {/* Phân bố theo khối */}
          <section className={`${card} p-6`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#0F172A]">Phân bố nhân sự theo khối</h2>
                <p className="text-[14px] text-[#64748B]">Khối đông nhất xếp trên cùng.</p>
              </div>
              <Link to="/admin/org" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#008BC5] hover:underline">Xem cơ cấu <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {blockDistribution.length === 0 ? (
              <p className="py-8 text-center text-[14px] text-[#94A3B8]">Chưa có dữ liệu khối.</p>
            ) : (
              <ul className="mt-5 grid gap-x-10 gap-y-4 lg:grid-cols-2">
                {blockDistribution.map((b) => (
                  <li key={b.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-[#1E293B]"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: b.color }} /><span className="truncate">{b.name}</span></span>
                      <span className="shrink-0 tabular-nums text-[#64748B]"><strong className="text-[#0F172A]">{b.count}</strong> người · {b.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]"><div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} /></div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Nhân sự mới */}
          <section className={`${card} p-6`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#0F172A]">Nhân sự mới cập nhật</h2>
                <p className="text-[14px] text-[#64748B]">6 nhân sự mới nhất trong cơ sở dữ liệu.</p>
              </div>
              <Link to="/admin/employees" className="inline-flex items-center gap-1 text-[13px] font-bold text-[#008BC5] hover:underline">Xem tất cả ({employees.length}) <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[12px] uppercase tracking-wider text-[#64748B]">
                    <th className="px-3 py-2.5 font-bold">Mã NV</th>
                    <th className="px-3 py-2.5 font-bold">Họ và tên</th>
                    <th className="px-3 py-2.5 font-bold">Phòng ban</th>
                    <th className="px-3 py-2.5 font-bold">Khối</th>
                    <th className="px-3 py-2.5 text-right font-bold">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {recentEmployees.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-[#94A3B8]">Chưa có nhân sự nào.</td></tr>
                  ) : recentEmployees.map((emp) => (
                    <tr key={emp.code} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-3 py-3 font-mono font-bold text-[#0F172A]">{emp.code}</td>
                      <td className="px-3 py-3 font-semibold text-[#0F172A]">{emp.name}</td>
                      <td className="px-3 py-3 text-[#475569]">{(emp.departmentId && deptMap.get(emp.departmentId)) || '—'}</td>
                      <td className="px-3 py-3 text-[#475569]">{emp.blockId ? blockMap.get(emp.blockId) || '—' : <span className="text-[12px] font-semibold text-[#E53E3E]">Chưa có</span>}</td>
                      <td className="px-3 py-3 text-right"><Badge variant={emp.role === ROLES.ADMIN ? 'error' : emp.role === ROLES.MANAGER ? 'warning' : 'neutral'}>{ROLE_LABELS[emp.role] || emp.role}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Hội trường */}
          <section className={`${card} p-6`}>
            <h2 className="text-[18px] font-extrabold text-[#0F172A]">Hội trường</h2>
            <p className="text-[14px] text-[#64748B]">{individual ? 'Xếp chỗ từng người' : 'Xếp chỗ theo nhóm'} · do Quản lý phụ trách vận hành.</p>
            <div className="mt-5 flex items-center gap-5">
              <Ring value={seatPct}><span className="text-[26px] font-extrabold tabular-nums text-[#0F172A]">{seatPct}%</span></Ring>
              <div className="min-w-0 space-y-3">
                <p className="flex items-center gap-2 text-[14px] text-[#475569]"><Armchair className="h-4 w-4 text-[#008BC5]" /><span><strong className="text-[18px] tabular-nums text-[#0F172A]">{assignedSeats}</strong> / {TOTAL_SEATS} ghế đã sắp</span></p>
                <p className="flex items-center gap-2 text-[14px] text-[#475569]"><UserCheck className="h-4 w-4 text-[#16A34A]" /><span><strong className="text-[18px] tabular-nums text-[#0F172A]">{attendance.length}</strong> người đã điểm danh</span></p>
              </div>
            </div>
          </section>

          {/* Công cụ */}
          <section className={`${card} p-6`}>
            <h2 className="text-[18px] font-extrabold text-[#0F172A]">Công cụ quản trị</h2>
            <ul className="mt-4 space-y-2.5">
              {tools.map(({ to, icon: Icon, title, sub, color, bg }) => (
                <li key={to}>
                  <Link to={to} className="group flex items-center gap-3 rounded-xl border border-[#E2E8F0] p-3 transition hover:border-[#BAE6FD] hover:bg-[#F8FAFC]">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: bg, color }}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-bold text-[#0F172A]">{title}</span><span className="block truncate text-[13px] text-[#64748B]">{sub}</span></span>
                    <ArrowRight className="h-4 w-4 text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#008BC5]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}