import React, { useEffect, useMemo, useRef, useState } from 'react';
import { seatService } from '../../services/seatService.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useToast } from '../../context/ToastContext.jsx';
import { seatLabel } from '../../utils/seatLabel.js';
import { useOrg } from '../../hooks/useOrg.js';
import { ROLES, GUEST_GROUP_ID } from '../../constants/roles.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { TOTAL_ROWS, SEATS_PER_SIDE, seatId } from '../../constants/hall.js';
import { HallMap } from './HallMap.jsx';
import { SeatInfoTip, buildSeatTip } from './SeatInfoTip.jsx';
import { useGroups } from '../../hooks/useGroups.js';
import { useAttendance } from '../../hooks/useAttendance.js';
import { resolveGroup } from '../../utils/resolveGroup.js';
import { Select } from '../ui/Select.jsx';
import { Pagination } from '../ui/Pagination.jsx';

const PAGE_SIZE = 20;

// Chế độ "mỗi người một ghế cố định": bấm ghế trên sơ đồ -> bảng bên phải gán nhân viên (nhập mã hoặc tìm tên).
const ASSIGNED = '__assigned__';
const GROUPS = [{ id: ASSIGNED, name: 'Đã gán', color: '#008BC5' }];
// Thứ tự chạy ghế khi gán liên tiếp: từng hàng, bên trái 1..10 rồi bên phải 1..10, hết hàng thì xuống hàng sau
const ORDER = Array.from({ length: TOTAL_ROWS }, (_, r) => ['L', 'R'].flatMap((side) => Array.from({ length: SEATS_PER_SIDE }, (_, n) => seatId(r + 1, side, n + 1)))).flat();
const nextFree = (from, taken) => ORDER.slice(ORDER.indexOf(from) + 1).find((id) => !taken.has(id)) || null;
const plain = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

export function PersonalSeating() {
  const toast = useToast();
  const { employees } = useEmployees();
  const { blocks } = useOrg();
  const { groups } = useGroups();
  const { seatGroups: groupSeats, assignSeats } = useSeatAssignments(); // ghế gán theo nhóm (dùng cho khách mời)
  const [selRows, setSelRows] = useState([]); // các hàng đang chọn để gán khách mời
  const { attendance, refresh: refreshAttendance } = useAttendance();
  const [list, setList] = useState([]); // [{ seatId, employeeCode }]
  const [sel, setSel] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [block, setBlock] = useState(''); // lọc theo khối
  const [auto, setAuto] = useState(true); // gán xong tự nhảy sang ghế trống kế tiếp
  const panelRef = useRef(null);

  useEffect(() => {
    seatService.getPersonal().then(setList).catch((e) => toast.error(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && refreshAttendance(), 10000);
    return () => clearInterval(t);
  }, [refreshAttendance]);

  const people = useMemo(() => employees.filter((e) => e.role === ROLES.EMPLOYEE), [employees]);
  const nameOf = useMemo(() => new Map(employees.map((e) => [e.code?.toUpperCase(), e.name])), [employees]);
  const ownerOf = useMemo(() => new Map(list.map((s) => [s.seatId, s.employeeCode])), [list]);
  const seatOf = useMemo(() => new Map(list.map((s) => [s.employeeCode, s.seatId])), [list]);
  // Ghế tô theo màu nhóm của KHỐI người ngồi; chưa có nhóm thì màu xanh mặc định
  const seatGroups = useMemo(() => {
    const byCode = new Map(employees.map((e) => [e.code?.toUpperCase(), e]));
    return { ...groupSeats, ...Object.fromEntries(list.map((s) => [s.seatId, resolveGroup(byCode.get(s.employeeCode?.toUpperCase()), groups)?.id || ASSIGNED])) };
  }, [list, employees, groups, groupSeats]);
  const mapGroups = useMemo(() => [...groups, ...GROUPS], [groups]);
  const renderTip = (id) => { const d = buildSeatTip({ seatId: id, ownerCode: ownerOf.get(id), nameOf, attendance }); return d && <SeatInfoTip data={d} />; };

  const pick = (id) => {
    setSelRows([]);
    setSel(id);
    setQ('');
    if (window.innerWidth < 1024) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // seat = null: bỏ gán. Người đang giữ ghế khác sẽ được chuyển sang ghế này; người đang giữ ghế này bị thay ra.
  const assign = async (code, seat) => {
    try {
      const owner = seat && ownerOf.get(seat);
      if (owner && owner !== code) await seatService.assignEmployee(owner, null);
      const upd = await seatService.assignEmployee(code, seat);
      setList(upd);
      if (auto && seat) setSel(nextFree(seat, new Set(upd.map((x) => x.seatId))) || seat);
      toast.success(seat ? `Đã gán ${nameOf.get(code) || code} vào ${seatLabel(seat)}.` : `Đã bỏ ghế của ${nameOf.get(code) || code}.`);
      setQ('');
    } catch (e) {
      toast.error(e.message || 'Lỗi khi gán ghế.');
    }
  };

  // Khách mời không có mã nhân viên: gán thẳng ghế (hoặc cả hàng) cho nhóm Khách mời; ghế đã có người được giữ nguyên
  const guest = groups.find((g) => g.id === GUEST_GROUP_ID);
  const toggleRow = (r) => { setSel(''); setSelRows((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r].sort((a, b) => a - b))); };
  const assignGuest = async (ids, on) => {
    const free = ids.filter((id) => !ownerOf.has(id));
    if (!free.length) return toast.info('Không có ghế trống để gán.');
    try {
      await assignSeats(free, on ? GUEST_GROUP_ID : null);
      toast.success(on ? `Đã gán ${free.length} ghế cho Khách mời.` : `Đã bỏ gán khách ở ${free.length} ghế.`);
      setSelRows([]);
    } catch (e) {
      toast.error(e.message || 'Lỗi khi gán ghế.');
    }
  };
  const rowIds = selRows.flatMap((r) => ORDER.filter((id) => id.startsWith(`${r}-`)));
  const guestBtn = 'w-full min-h-[44px] rounded-lg text-[15px] font-bold cursor-pointer';

  const t = plain(q.trim());
  const pool = block ? people.filter((e) => e.blockId === block) : people;
  const matches = (t ? pool.filter((e) => plain(e.code).includes(t) || plain(e.name).includes(t)) : block ? pool : [])
    .sort((a, b) => seatOf.has(a.code) - seatOf.has(b.code) || a.name.localeCompare(b.name, 'vi')) // người chưa có ghế lên trước
    .slice(0, t ? 8 : 40);
  const unseated = pool.filter((e) => !seatOf.has(e.code)).length;
  const upNext = sel && auto ? nextFree(sel, new Set(list.map((x) => x.seatId))) : null;
  const onEnter = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const m = matches.find((x) => x.code.toLowerCase() === q.trim().toLowerCase()) || (matches.length === 1 ? matches[0] : null);
    if (m && sel) assign(m.code, sel);
  };

  const owner = sel && ownerOf.get(sel);
  const rows = [...list]
    .sort((a, b) => a.seatId.localeCompare(b.seatId, undefined, { numeric: true }))
    .filter((s) => !filter.trim() || plain(`${s.employeeCode} ${nameOf.get(s.employeeCode) || ''} ${seatLabel(s.seatId)}`).includes(plain(filter.trim())));

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const pageRows = rows.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  return (
    <div className="space-y-5 max-w-full">
      <div>
        <h1 className="text-[26px] font-extrabold text-[#0F172A] leading-tight">Xếp chỗ theo từng người</h1>
        <p className="text-[15px] text-[#475569] mt-1">
          Bấm vào một ghế trên sơ đồ, rồi nhập mã hoặc tên nhân viên ở bảng bên phải. Mỗi người chỉ được ngồi và điểm danh đúng ghế bạn gán. Ghế xanh là đã có người, rê chuột vào để xem tên.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <div className="overflow-x-auto rounded-xl">
            <div className="min-w-[760px]">
              <HallMap seatGroups={seatGroups} mode="assign" selectedRows={selRows} onToggleRow={toggleRow} groups={mapGroups} onSeatClick={pick} selectedSeatId={sel} renderSeatTip={renderTip} />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#EEF2F6]">
              <span className="text-[13px] font-bold uppercase tracking-wider text-[#64748B]">Đã gán: {list.length} người</span>
              <input className="h-9 w-56 rounded-lg border border-[#CBD5E1] px-3 text-[14px]" placeholder="Lọc theo mã, tên, hàng..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} />
            </div>
            <div className="divide-y divide-[#EEF2F6] ">
              {pageRows.map((s) => (
                <div key={s.seatId} className={`flex items-center justify-between gap-3 px-4 py-2 ${s.seatId === sel ? 'bg-[#EAF6FF]' : ''}`}>
                  <button type="button" onClick={() => pick(s.seatId)} className="min-w-0 text-left cursor-pointer">
                    <p className="text-[15px] font-bold text-[#0F172A] truncate">{nameOf.get(s.employeeCode) || s.employeeCode} <span className="font-mono text-[13px] font-medium text-[#64748B]">{s.employeeCode}</span></p>
                    <p className="text-[14px] text-[#334155]">{seatLabel(s.seatId)}</p>
                  </button>
                  <button type="button" onClick={() => assign(s.employeeCode, null)} className="min-h-[36px] px-2 text-[13px] font-bold text-[#C53030] hover:underline cursor-pointer">Bỏ gán</button>
                </div>
              ))}
              {rows.length === 0 && <p className="px-4 py-6 text-[14px] text-[#64748B]">{list.length ? 'Không có kết quả.' : 'Chưa gán ai.'}</p>}
            </div>
            <div className="px-4 py-3 border-t border-[#EEF2F6] empty:hidden"><Pagination page={cur} pages={pages} total={rows.length} limit={PAGE_SIZE} onChange={setPage} /></div>
          </div>
        </div>

        <aside ref={panelRef} className="lg:sticky lg:top-24 scroll-mt-20 bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
          {selRows.length ? (
            <>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#64748B]">Đã chọn cả hàng</p>
                <p className="text-[20px] font-extrabold text-[#0F172A]">{selRows.map((r) => `Hàng ${r}`).join(', ')}</p>
                <p className="text-[14px] text-[#64748B]">{rowIds.filter((id) => !ownerOf.has(id)).length} ghế trống (ghế đã có người được giữ nguyên)</p>
              </div>
              <button type="button" disabled={!guest} onClick={() => assignGuest(rowIds, true)} className={`${guestBtn} text-white disabled:opacity-50`} style={{ background: guest?.color || '#475569' }}>Gán cả hàng cho Khách mời</button>
              <button type="button" onClick={() => assignGuest(rowIds, false)} className={`${guestBtn} border border-[#CBD5E1] text-[#C53030] bg-white`}>Bỏ gán khách ở các hàng này</button>
              <button type="button" onClick={() => setSelRows([])} className="w-full text-[14px] text-[#64748B] hover:underline cursor-pointer">Bỏ chọn hàng</button>
            </>
          ) : !sel ? (
            <p className="text-[15px] text-[#475569]">Bấm vào một ghế để gán nhân viên, hoặc bấm chữ "Hàng x" để chọn cả hàng gán cho khách mời.</p>
          ) : (
            <>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#64748B]">Ghế đang chọn</p>
                <p className="text-[20px] font-extrabold text-[#0F172A]">{seatLabel(sel)}</p>
              </div>
              {owner ? (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-[#EAF6FF] border border-[#BAE6FD] px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#0F172A] truncate">{nameOf.get(owner) || owner}</p>
                    <p className="font-mono text-[13px] text-[#475569]">{owner}</p>
                  </div>
                  <button type="button" onClick={() => assign(owner, null)} className="text-[13px] font-bold text-[#C53030] hover:underline cursor-pointer">Bỏ gán</button>
                </div>
              ) : (
                <p className="text-[14px] font-semibold text-[#64748B]">Ghế đang trống.</p>
              )}
              <div className="space-y-1.5">
                <Select size="sm" value={block} onChange={(e) => setBlock(e.target.value)} options={[{ value: '', label: 'Tất cả các khối' }, ...blocks.map((b) => ({ value: b.id, label: b.name }))]} />
                {block && <p className="text-[13px] text-[#64748B]">Còn {unseated}/{pool.length} người chưa có ghế (xếp lên đầu danh sách).</p>}
                {!owner && (groupSeats[sel] === GUEST_GROUP_ID
                  ? <button type="button" onClick={() => assignGuest([sel], false)} className={`${guestBtn} border border-[#CBD5E1] text-[#C53030] bg-white`}>Bỏ gán Khách mời</button>
                  : <button type="button" disabled={!guest} onClick={() => assignGuest([sel], true)} className={`${guestBtn} text-white disabled:opacity-50`} style={{ background: guest?.color || '#475569' }}>Gán ghế này cho Khách mời</button>)}
                <label htmlFor="pick-emp" className="text-[14px] font-bold text-[#0F172A]">{owner ? 'Đổi sang người khác' : 'Gán cho'}</label>
                <input
                  id="pick-emp"
                  key={sel}
                  autoFocus
                  autoComplete="off"
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] px-3 text-[15px]"
                  placeholder="Nhập mã hoặc tên, Enter để gán"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onEnter}
                />
                <ul className="max-h-72 overflow-y-auto divide-y divide-[#EEF2F6] rounded-lg border border-[#EEF2F6] empty:hidden">
                  {matches.map((e) => (
                    <li key={e.code}>
                      <button type="button" onClick={() => assign(e.code, sel)} className="w-full text-left px-3 py-2 hover:bg-[#F1F5F9] cursor-pointer">
                        <span className="text-[14px] font-bold text-[#0F172A]">{e.name}</span>{' '}
                        <span className="font-mono text-[13px] text-[#64748B]">{e.code}</span>
                        {seatOf.has(e.code) && <span className="block text-[12px] text-[#B45309]">Đang ở {seatLabel(seatOf.get(e.code))}, sẽ chuyển sang ghế này</span>}
                      </button>
                    </li>
                  ))}
                </ul>
                <label className="flex items-center gap-2 pt-1 text-[13px] text-[#334155] cursor-pointer select-none">
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4" />
                  Gán xong tự nhảy sang ghế trống kế tiếp{upNext && <span className="text-[#64748B]"> ({seatLabel(upNext)})</span>}
                </label>
                {t && matches.length === 0 && <p className="text-[13px] text-[#C53030]">Không thấy nhân viên nào khớp.</p>}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}