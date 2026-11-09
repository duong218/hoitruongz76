import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Lock, RefreshCw, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { historyService } from '../../services/historyService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { seatBadgeText } from '../../utils/seatLabel.js';

const fmt = (d) => (d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const CAUSE = { reset: 'Đặt lại điểm danh', start_new: 'Bắt đầu sự kiện mới', auto_end: 'Tự lưu khi hết giờ' };

// Chỉ xem + xuất Excel. Không có nút điểm danh hộ / đặt lại: sự kiện cũ không sửa được.
export function EventHistoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [opening, setOpening] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setList(await historyService.list());
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử sự kiện.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = async (id) => {
    setOpening(id);
    try {
      setDetail(await historyService.get(id));
    } catch (err) {
      toast.error(err.message || 'Không mở được sự kiện này.');
      load(); // có thể đã bị xóa trực tiếp trong DB
    } finally {
      setOpening('');
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const { exportArchiveXlsx } = await import('../../utils/excelExport.js');
      await exportArchiveXlsx(detail, user?.name ? `${user.name} (${user.code})` : user?.code);
      historyService.logExport(detail.id).catch(() => {}); // dấu vết: ai xuất file cũ
      toast.success('Đã xuất Excel sự kiện đã lưu.');
    } catch (err) {
      toast.error(err.message || 'Không xuất được file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const shown = useMemo(() => (detail ? detail.rows : []), [detail]);

  if (detail) {
    const miss = detail.rows.filter((r) => r.required && !r.checked).length;
    return (
      <div className="space-y-6 w-full">
        <Button variant="secondary" icon={ArrowLeft} onClick={() => setDetail(null)}>Quay lại danh sách</Button>
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">{detail.eventName}</h1>
          <p className="text-[16px] text-[#64748B] mt-1">
            Bắt đầu: {fmt(detail.startedAt)} · Lưu lúc: {fmt(detail.archivedAt)} · {CAUSE[detail.cause]}
            {detail.archivedBy ? ` (bởi ${detail.archivedBy})` : ''}
          </p>
        </div>
        <div className="flex items-start gap-3 p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[15px] text-[#334155]">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          Sự kiện đã diễn ra: chỉ xem và xuất Excel. Không điểm danh hộ hay đặt lại được.
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Cần điểm danh: {detail.summary.required}</Badge>
          <Badge variant="success">Đã: {detail.summary.checked}</Badge>
          <Badge variant="error">Vắng: {miss}</Badge>
          <Badge variant="warning">Điểm danh hộ: {detail.summary.proxy}</Badge>
          <Button variant="primary" icon={Download} onClick={doExport} loading={exporting} className="sm:ml-auto">
            Xuất Excel ({detail.rows.length})
          </Button>
        </div>
        <div className="overflow-x-auto bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
          <table className="w-full text-left border-collapse text-[15px] min-w-[760px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                {['Mã NV', 'Họ và tên', 'Khối', 'Phòng ban', 'Ghế', 'Giờ quét', 'Trạng thái'].map((h) => (
                  <th key={h} className="py-3 px-4 font-bold text-[#475569] uppercase text-[13px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.code} className={`border-b border-[#E2E8F0] ${i % 2 ? 'bg-[#F6F8FA]' : 'bg-white'}`}>
                  <td className="py-3 px-4 font-bold font-mono">{r.code}</td>
                  <td className="py-3 px-4 font-medium">{r.name}</td>
                  <td className="py-3 px-4 text-[#334155]">{r.block || '—'}</td>
                  <td className="py-3 px-4 text-[#334155]">{r.dept || '—'}</td>
                  <td className="py-3 px-4 font-semibold">{r.checked ? (r.seatId ? seatBadgeText(r.seatId) : 'Không có ghế') : '—'}</td>
                  <td className="py-3 px-4 text-[#64748B]">{r.checked ? fmt(r.checkedInAt) : '—'}</td>
                  <td className="py-3 px-4">
                    {r.checked ? (
                      <Badge variant={r.method === 'PROXY' ? 'warning' : 'success'} icon={CheckCircle2}>
                        {r.method === 'PROXY' ? 'Điểm danh hộ' : 'Đã điểm danh'}
                      </Badge>
                    ) : (
                      <Badge variant="error" icon={XCircle}>Vắng</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">Lịch sử sự kiện đã diễn ra</h1>
          <p className="text-[16px] text-[#64748B] mt-1">Bấm vào một sự kiện để xem danh sách và xuất Excel.</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={load} className="sm:ml-auto">Làm mới</Button>
      </div>

      {loading && <p className="text-[16px] text-[#64748B]">Đang tải...</p>}
      {error && <p className="p-4 bg-[#FEECEC] text-[#B91C1C] rounded-lg text-[16px]">{error}</p>}
      {!loading && !error && list.length === 0 && (
        <p className="p-6 bg-white border border-[#E2E8F0] rounded-xl text-[16px] text-[#64748B]">
          Chưa có sự kiện nào được lưu. Sự kiện sẽ tự vào đây khi bạn bấm "Bắt đầu sự kiện mới", hoặc "Đặt lại điểm danh" có tích lưu.
        </p>
      )}
      <ul className="space-y-3">
        {list.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => open(a.id)}
              disabled={!!opening}
              className="w-full min-h-[64px] text-left bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex items-center gap-3 hover:bg-[#EAF6FF]/40 disabled:opacity-60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[18px] font-bold text-[#0F172A] break-words">{a.eventName}</p>
                <p className="text-[14px] text-[#64748B]">
                  Lưu lúc {fmt(a.archivedAt)} · {CAUSE[a.cause]} · {a.summary.checked}/{a.summary.required} đã điểm danh
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B] shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
