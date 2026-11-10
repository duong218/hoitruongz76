import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { seatLabel } from '../../utils/seatLabel.js';

const hhmm = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Gom thông tin 1 ghế để hiện khi rê chuột; null nếu ghế không có gì để báo. */
export function buildSeatTip({ seatId, ownerCode, nameOf, attendance }) {
  const recs = attendance.filter((a) => a.seatId === seatId);
  const dup = new Set(recs.map((r) => r.employeeCode.toUpperCase())).size > 1;
  if (!ownerCode && !recs.length) return null;
  const att = (code) => recs.find((r) => r.employeeCode.toUpperCase() === code?.toUpperCase());
  const name = (code) => nameOf.get(code?.toUpperCase()) || code;
  return { seatId, ownerCode, dup, ownerAtt: att(ownerCode), name, recs };
}

export function SeatInfoTip({ data }) {
  const navigate = useNavigate();
  const { seatId, ownerCode, dup, ownerAtt, name, recs } = data;
  return (
    <div className="w-64 rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-lg text-[14px] space-y-1.5">
      <p className="text-[12px] font-bold uppercase tracking-wider text-[#64748B]">{seatLabel(seatId)}</p>
      {ownerCode && (
        <div>
          <p className="font-bold text-[#0F172A]">{name(ownerCode)} <span className="font-mono text-[13px] font-medium text-[#64748B]">{ownerCode}</span></p>
          <p className={ownerAtt ? 'text-[#15803D] font-semibold' : 'text-[#64748B]'}>{ownerAtt ? `Đã điểm danh lúc ${hhmm(ownerAtt.checkedInAt)}` : 'Chưa điểm danh'}</p>
        </div>
      )}
      {dup && (
        <div className="rounded-lg bg-[#FEE2E2] border border-[#FCA5A5] p-2 space-y-1">
          <p className="flex items-center gap-1.5 font-bold text-[#B91C1C]"><AlertTriangle className="w-4 h-4 shrink-0" />Điểm danh trùng ({recs.length} người)</p>
          {recs.map((r) => <p key={r.employeeCode} className="text-[13px] text-[#7F1D1D]">{name(r.employeeCode)} ({r.employeeCode}) · {hhmm(r.checkedInAt)}</p>)}
          <button type="button" onClick={() => navigate('/manager/attendance', { state: { seat: seatId } })} className="mt-1 w-full min-h-[36px] rounded-lg bg-[#B91C1C] text-white text-[13px] font-bold cursor-pointer">Xem</button>
        </div>
      )}
      {!ownerCode && !dup && recs.map((r) => <p key={r.employeeCode} className="text-[13px]">{name(r.employeeCode)} ({r.employeeCode}) · {hhmm(r.checkedInAt)}</p>)}
    </div>
  );
}