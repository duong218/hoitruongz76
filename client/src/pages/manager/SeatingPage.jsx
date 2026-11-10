import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useToast } from '../../context/ToastContext.jsx';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { SeatRowEditor } from '../../components/hall/SeatRowEditor.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PersonalSeating } from '../../components/hall/PersonalSeating.jsx';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { BottomSheet } from '../../components/ui/BottomSheet.jsx';
import { TOTAL_SEATS } from '../../constants/hall.js';
import { Edit3, XCircle, Info, CheckSquare, ArrowDown } from 'lucide-react';

export function SeatingPage() {
  const { groups } = useGroups();
  const { seatGroups, assignRows, assignSeats } = useSeatAssignments();
  const toast = useToast();
  const { event } = useEventSettings();

  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowNumber, setEditingRowNumber] = useState(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // Toggle chọn một hàng
  const handleToggleRow = (row) => {
    setSelectedRows((prev) => {
      const next = prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row].sort((a, b) => a - b);
      if (next.length > 0 && window.innerWidth < 1024) {
        setMobilePanelOpen(true);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedRows([]);
    setMobilePanelOpen(false);
  };

  // Gán nhóm cho các hàng đã chọn
  const handleAssignRows = async (groupId) => {
    if (selectedRows.length === 0) return;

    const rowNames = selectedRows.map((r) => `Hàng ${r}`).join(', ');
    const targetGroup = groups.find((g) => g.id === groupId);

    try {
      await assignRows(selectedRows, groupId);
      if (groupId && targetGroup) {
        toast.success(`Đã gán ${rowNames} cho ${targetGroup.name}.`);
      } else {
        toast.info(`Đã bỏ gán toàn bộ ghế của ${rowNames}.`);
      }
      setSelectedRows([]);
      setMobilePanelOpen(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gán hàng ghế.');
    }
  };

  // Gán ghế lẻ qua SeatRowEditor
  const handleAssignIndividualSeats = async (seatIds, groupId) => {
    try {
      await assignSeats(seatIds, groupId);
      const targetGroup = groups.find((g) => g.id === groupId);
      if (groupId && targetGroup) {
        toast.success(`Đã gán ${seatIds.length} ghế cho ${targetGroup.name}.`);
      } else {
        toast.info(`Đã bỏ gán ${seatIds.length} ghế.`);
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi gán từng ghế.');
    }
  };

  // Đếm số ghế hiện có của từng nhóm
  const seatCounts = React.useMemo(() => {
    const counts = {};
    Object.values(seatGroups).forEach((gId) => {
      counts[gId] = (counts[gId] || 0) + 1;
    });
    return counts;
  }, [seatGroups]);

  const hasSel = selectedRows.length > 0;
  const assignedCount = Object.keys(seatGroups).length;
  const freeCount = TOTAL_SEATS - assignedCount;

  // Danh sách nhóm vừa là chú thích màu (khi chưa chọn hàng) vừa là nút gán (khi đã chọn hàng)
  const renderGroupSelector = ({ wide = false, part = 'all' } = {}) => (
    <div className="space-y-4">
      {part !== 'list' && (hasSel ? (
        <div className="bg-[#EAF6FF] border border-[#BAE6FD] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold uppercase tracking-wider text-[#006BA1]">
              Đang chọn {selectedRows.length} hàng · {selectedRows.length * 20} ghế
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[13px] font-bold text-[#E53E3E] hover:underline min-h-[32px] flex items-center cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
          <p className="text-[17px] font-extrabold text-[#0F172A]">
            {selectedRows.map((r) => `Hàng ${r}`).join(', ')}
          </p>
          {selectedRows.length === 1 && (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              icon={Edit3}
              onClick={() => setEditingRowNumber(selectedRows[0])}
            >
              Chỉnh từng ghế lẻ hàng {selectedRows[0]}
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-[14px] leading-snug text-[#475569] flex items-start gap-2">
          <Info className="w-4 h-4 text-[#008BC5] shrink-0 mt-0.5" />
          <span>Bấm trực tiếp vào các hàng ghế trên sơ đồ để chọn, sau đó bấm nhóm bên dưới để gán.</span>
        </div>
      ))}

      {part !== 'info' && (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-extrabold uppercase tracking-wider text-[#475569]">
            {hasSel ? 'Chọn nhóm để gán ngay:' : 'Danh mục các nhóm ghế:'}
          </span>
          {hasSel && (
            <span className="text-[12px] font-bold text-[#008BC5] animate-pulse">
              Nhấp để gán
            </span>
          )}
        </div>

        <ul className={`list-none p-0 ${wide ? 'grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2' : 'space-y-2 max-h-[460px] overflow-y-auto pr-1'}`}>
          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                disabled={!hasSel}
                onClick={() => handleAssignRows(group.id)}
                title={hasSel ? `Bấm để gán ${selectedRows.map(r => `Hàng ${r}`).join(', ')} cho ${group.name}` : group.name}
                className={`w-full min-h-[50px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-all ${
                  hasSel
                    ? 'bg-white border-2 border-[#E2E8F0] hover:border-[#008BC5] hover:bg-[#EAF6FF]/60 hover:shadow-md cursor-pointer active:scale-[0.99]'
                    : 'bg-white border border-[#E2E8F0] cursor-default'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    aria-hidden="true"
                    className="w-4.5 h-4.5 rounded-md shrink-0 border border-black/10 shadow-sm"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-[15px] font-bold text-[#0F172A] break-words line-clamp-2">
                    {group.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[13px] font-semibold text-[#64748B] tabular-nums whitespace-nowrap bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                    {seatCounts[group.id] || 0} ghế
                  </span>
                  {hasSel && (
                    <span className="text-[13px] font-extrabold text-white bg-[#008BC5] px-2.5 py-1 rounded-lg shadow-sm">
                      Gán
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}

          <li className="min-h-[40px] px-3.5 py-2 rounded-lg flex items-center justify-between gap-3 text-[#64748B] bg-[#F8FAFC]">
            <span className="flex items-center gap-3">
              <span aria-hidden="true" className="w-4 h-4 rounded-md border border-black/10 bg-[#E2E8F0]" />
              <span className="text-[14px] font-semibold">Chưa gán</span>
            </span>
            <span className="text-[13px] font-semibold tabular-nums">{freeCount} ghế</span>
          </li>
        </ul>

        {hasSel && (
          <button
            type="button"
            onClick={() => handleAssignRows(null)}
            className="mt-3 w-full min-h-[44px] px-3 bg-white border border-[#E53E3E]/40 text-[#C53030] rounded-xl flex items-center justify-center gap-2 text-[14px] font-bold hover:bg-[#FEECEC] active:bg-[#FECACA] transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            Bỏ gán các hàng đã chọn (về xám)
          </button>
        )}
      </div>
      )}
    </div>
  );

  // Cuộn xuống bảng gán nhóm nhanh nằm dưới sơ đồ
  const scrollToGroupPanel = () =>
    document.getElementById('seating-group-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (event.seatMode === 'individual') return <PersonalSeating />;

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-[26px] font-extrabold text-[#0F172A] leading-tight">Sắp xếp chỗ ngồi</h1>
        <p className="text-[15px] text-[#475569] mt-1">
          Bấm vào hàng ghế trên sơ đồ để gán cả hàng (20 ghế), hoặc chọn 1 hàng để chỉnh từng ghế lẻ.{' '}
          <span className="inline-block font-semibold text-[#008BC5]">
            (Quy ước: Ghế 1 ở sát lối đi giữa, ghế 10 ở sát tường hai bên).
          </span>
        </p>
      </div>

      {/* Bố cục 2 cột trên Desktop (>= 1024px): Cột trái bản đồ linh hoạt, cột phải bảng nhóm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Sơ đồ hội trường chế độ ASSIGN */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9">
          <HallMap
            mode="assign"
            seatGroups={seatGroups}
            groups={groups}
            selectedRows={selectedRows}
            onToggleRow={handleToggleRow}
          />

          {/* Panel Chọn nhóm: nằm ngay dưới sơ đồ (Desktop), các nhóm xếp 2-3 cột cho đủ thông tin */}
          <div id="seating-group-panel" className="hidden lg:block mt-6 scroll-mt-24 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
            <h3 className="text-[18px] font-extrabold text-[#0F172A] pb-3 border-b border-[#E2E8F0] mb-4">
              Gán nhóm nhanh
            </h3>
            {renderGroupSelector({ wide: true, part: 'list' })}
          </div>
        </div>

        {/* Cột phải trên Desktop: Thẻ tiến độ & thông tin hàng đang chọn */}
        <div className="hidden lg:flex lg:flex-col lg:col-span-4 xl:col-span-4 2xl:col-span-3 gap-4 sticky top-24">
          {/* Thẻ tiến độ nằm ngay trên mục Gán nhóm */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider">
                Tiến độ sắp ghế
              </span>
              <span className="text-[13px] font-bold text-[#008BC5]">
                {Math.round((assignedCount / TOTAL_SEATS) * 100)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2.5">
              <div className="text-[24px] font-black text-[#0F172A] tabular-nums leading-none">
                {assignedCount} <span className="text-[15px] font-semibold text-[#64748B]">/ {TOTAL_SEATS} ghế</span>
              </div>
              <span className="text-[13px] font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-1 rounded-full">
                Còn trống: {freeCount}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#008BC5] h-full transition-all duration-300"
                style={{ width: `${(assignedCount / TOTAL_SEATS) * 100}%` }}
              />
            </div>
          </div>

          {/* Hàng đang chọn + chỉ dẫn gán nhóm nhanh bên dưới sơ đồ */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3">
            <h3 className="text-[16px] font-extrabold text-[#0F172A]">Gán nhóm cho hàng ghế</h3>
            {renderGroupSelector({ part: 'info' })}
            <button
              type="button"
              onClick={scrollToGroupPanel}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[#008BC5] text-[#008BC5] hover:bg-[#EAF6FF] flex items-center justify-center gap-2 text-[14px] font-bold transition-colors cursor-pointer"
            >
              <ArrowDown className="w-4 h-4 shrink-0" />
              Gán nhóm nhanh ở bên dưới sơ đồ
            </button>
          </div>
        </div>
      </div>

      {/* Nổi thanh trạng thái trên Mobile khi có hàng được chọn */}
      {selectedRows.length > 0 && (
        <div className="lg:hidden fixed bottom-18 left-4 right-4 z-40 bg-white border-2 border-[#008BC5] rounded-xl shadow-[0_4px_16px_rgba(0,139,197,0.3)] p-3 flex items-center justify-between gap-3 animate-in fade-in">
          <div>
            <span className="text-[12px] font-bold text-[#008BC5] block">ĐANG CHỌN</span>
            <span className="text-[15px] font-extrabold text-[#0F172A]">
              {selectedRows.map((r) => `Hàng ${r}`).join(', ')}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setMobilePanelOpen(true)}
          >
            Chọn nhóm gán
          </Button>
        </div>
      )}

      {/* BottomSheet trên Mobile */}
      <BottomSheet
        isOpen={mobilePanelOpen}
        onClose={() => setMobilePanelOpen(false)}
        title="Chọn nhóm cho hàng ghế"
      >
        {/* Thẻ tiến độ cũng hiện trên đầu BottomSheet mobile */}
        <div className="mb-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between text-[14px]">
          <span className="font-semibold text-[#475569]">Tiến độ hội trường:</span>
          <span className="font-bold text-[#0F172A]">
            <strong className="text-[#008BC5]">{assignedCount}</strong>/{TOTAL_SEATS} ghế (trống {freeCount})
          </span>
        </div>
        {renderGroupSelector()}
      </BottomSheet>

      {/* SeatRowEditor cho chỉnh ghế lẻ */}
      <SeatRowEditor
        isOpen={!!editingRowNumber}
        onClose={() => setEditingRowNumber(null)}
        row={editingRowNumber}
        seatGroups={seatGroups}
        groups={groups}
        onAssignSeats={handleAssignIndividualSeats}
      />
    </div>
  );
}