import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useToast } from '../../context/ToastContext.jsx';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { SeatRowEditor } from '../../components/hall/SeatRowEditor.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { BottomSheet } from '../../components/ui/BottomSheet.jsx';
import { TOTAL_SEATS } from '../../constants/hall.js';
import { Edit3, XCircle, Info } from 'lucide-react';

export function SeatingPage() {
  const { groups } = useGroups();
  const { seatGroups, assignRows, assignSeats } = useSeatAssignments();
  const toast = useToast();

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
  const renderGroupSelector = () => (
    <div className="space-y-4">
      {hasSel ? (
        <div className="bg-[#EAF6FF] border border-[#BAE6FD] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-bold uppercase tracking-wider text-[#006BA1]">
              Đang chọn {selectedRows.length} hàng · {selectedRows.length * 20} ghế
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[14px] font-semibold text-[#475569] hover:text-[#0F172A] min-h-[36px] flex items-center cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
          <p className="text-[18px] font-extrabold text-[#0F172A]">
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
        <p className="flex items-start gap-2 text-[15px] leading-snug text-[#475569]">
          <Info className="w-5 h-5 text-[#008BC5] shrink-0 mt-0.5" />
          Bấm vào hàng ghế (hoặc nhãn hàng) trên sơ đồ để chọn, rồi bấm nhóm bên dưới để gán.
        </p>
      )}

      <div>
        <span className="block text-[14px] font-bold uppercase tracking-wider text-[#475569] mb-2">
          {hasSel ? 'Gán cho nhóm' : 'Các nhóm'}
        </span>
        <ul className="space-y-2 list-none p-0 max-h-[420px] overflow-y-auto pr-1">
          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                disabled={!hasSel}
                onClick={() => handleAssignRows(group.id)}
                className="w-full min-h-[48px] px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between gap-3 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-[#F6F8FA] enabled:hover:border-[#008BC5] enabled:active:bg-[#EAF6FF] disabled:cursor-default"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-md shrink-0 border border-black/10"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-[16px] font-semibold text-[#0F172A] truncate">{group.name}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="text-[14px] font-semibold text-[#475569] tabular-nums">
                    {seatCounts[group.id] || 0} ghế
                  </span>
                  {hasSel && <span className="text-[14px] font-bold text-[#008BC5]">Gán</span>}
                </span>
              </button>
            </li>
          ))}

          <li className="min-h-[40px] px-3 flex items-center justify-between gap-3 text-[#475569]">
            <span className="flex items-center gap-3">
              <span aria-hidden="true" className="w-5 h-5 rounded-md border border-black/10 bg-[#E2E8F0]" />
              <span className="text-[15px] font-semibold">Chưa gán</span>
            </span>
            <span className="text-[14px] font-semibold tabular-nums">{freeCount} ghế</span>
          </li>
        </ul>

        {hasSel && (
          <button
            type="button"
            onClick={() => handleAssignRows(null)}
            className="mt-3 w-full min-h-[44px] px-3 bg-white border border-[#E53E3E]/40 text-[#C53030] rounded-lg flex items-center justify-center gap-2 text-[15px] font-semibold hover:bg-[#FEECEC] active:bg-[#FECACA] transition-colors cursor-pointer"
          >
            <XCircle className="w-5 h-5 shrink-0" />
            Bỏ gán các hàng đã chọn
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0F172A] leading-tight">Sắp xếp chỗ ngồi</h1>
          <p className="text-[15px] text-[#475569] mt-1">
            Bấm vào hàng ghế trên sơ đồ để gán cả hàng (20 ghế), hoặc chọn 1 hàng để chỉnh từng ghế lẻ.{' '}
            <span className="inline-block font-semibold text-[#008BC5]">
              (Quy ước: Ghế 1 ở sát lối đi giữa, ghế 10 ở sát tường hai bên).
            </span>
          </p>
        </div>
        <p className="text-[15px] text-[#475569] tabular-nums">
          <strong className="text-[20px] text-[#0F172A]">{assignedCount}</strong> / {TOTAL_SEATS} ghế đã sắp · còn trống {freeCount}
        </p>
      </div>

      {/* Bố cục 2 cột trên Desktop (>= 1024px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Sơ đồ hội trường chế độ ASSIGN */}
        <div className="lg:col-span-8">
          <HallMap
            mode="assign"
            seatGroups={seatGroups}
            groups={groups}
            selectedRows={selectedRows}
            onToggleRow={handleToggleRow}
          />
        </div>

        {/* Cột phải trên Desktop: Panel Chọn nhóm */}
        <div className="hidden lg:block lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] sticky top-24">
          <h3 className="text-[18px] font-bold text-[#0F172A] pb-3 border-b border-[#E2E8F0] mb-4">
            Gán nhóm cho hàng ghế
          </h3>
          {renderGroupSelector()}
        </div>
      </div>

      {/* Nổi thanh trạng thái trên Mobile khi có hàng được chọn */}
      {selectedRows.length > 0 && (
        <div className="lg:hidden fixed bottom-18 left-4 right-4 z-40 bg-white border border-[#008BC5] rounded-xl shadow-[0_2px_8px_rgba(0,139,197,0.25)] p-3 flex items-center justify-between gap-3 animate-in fade-in">
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
