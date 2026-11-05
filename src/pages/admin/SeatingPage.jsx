import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useToast } from '../../context/ToastContext.jsx';
import { HallMap } from '../../components/hall/HallMap.jsx';
import { HallLegend } from '../../components/hall/HallLegend.jsx';
import { SeatRowEditor } from '../../components/hall/SeatRowEditor.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { BottomSheet } from '../../components/ui/BottomSheet.jsx';
import { Edit3, XCircle, Check, Info } from 'lucide-react';

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

  // Panel nội dung chọn nhóm
  const renderGroupSelector = () => (
    <div className="space-y-4">
      {selectedRows.length === 0 ? (
        <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center space-y-2">
          <Info className="w-8 h-8 text-[#008BC5] mx-auto" />
          <h4 className="text-[17px] font-bold text-[#0F172A]">Chưa chọn hàng nào</h4>
          <p className="text-[15px] text-[#64748B] leading-relaxed">
            Bấm vào hàng ghế trên sơ đồ hội trường (hoặc nhãn hàng) để chọn một hoặc nhiều hàng cần phân bổ.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Thông tin hàng đã chọn */}
          <div className="bg-[#EAF6FF] border border-[#BAE6FD] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold uppercase tracking-wider text-[#008BC5]">
                Đang chọn {selectedRows.length} hàng
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] min-h-[36px] flex items-center"
              >
                Bỏ chọn
              </button>
            </div>
            <p className="text-[18px] font-extrabold text-[#0F172A]">
              Đã chọn: {selectedRows.map((r) => `Hàng ${r}`).join(', ')}
            </p>
            <p className="text-[13px] text-[#008BC5]">
              Mỗi hàng gồm 20 ghế (10 bên trái + 10 bên phải). Bấm nhóm bên dưới để gán cùng lúc.
            </p>
          </div>

          {/* Nút chỉnh từng ghế (chỉ bật khi chọn đúng 1 hàng) */}
          {selectedRows.length === 1 && (
            <Button
              variant="secondary"
              fullWidth
              icon={Edit3}
              onClick={() => setEditingRowNumber(selectedRows[0])}
            >
              Chỉnh từng ghế lẻ hàng {selectedRows[0]}
            </Button>
          )}

          {/* Danh sách các nhóm để gán */}
          <div className="space-y-2">
            <span className="block text-[15px] font-bold text-[#0F172A]">
              Bấm nhóm để gán cả hàng ({selectedRows.length * 20} ghế):
            </span>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {groups.map((group) => {
                const count = seatCounts[group.id] || 0;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleAssignRows(group.id)}
                    className="w-full min-h-[48px] p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between hover:bg-[#F6F8FA] hover:border-[#008BC5] active:bg-[#EAF6FF] transition-all cursor-pointer text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md shrink-0 border border-black/10"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-[16px] font-semibold text-[#0F172A] truncate">
                        {group.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
                        Hiện có {count} ghế
                      </span>
                      <span className="text-[14px] font-bold text-[#008BC5] hover:underline">
                        Gán
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Nút Bỏ gán */}
              <button
                type="button"
                onClick={() => handleAssignRows(null)}
                className="w-full min-h-[48px] p-3 bg-white border border-[#E53E3E]/30 text-[#E53E3E] rounded-xl flex items-center justify-between hover:bg-[#FEECEC] active:bg-[#FECACA] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 shrink-0" />
                  <span className="text-[16px] font-semibold">
                    Bỏ gán các hàng đã chọn
                  </span>
                </div>
                <span className="text-[13px] font-bold">Xóa gán</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Sắp xếp Chỗ ngồi Hội trường
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Bấm trực tiếp vào các hàng ghế trên sơ đồ 2D để gán cả hàng (20 ghế) hoặc chọn 1 hàng để chỉnh từng ghế lẻ.
        </p>
      </div>

      {/* Bố cục 2 cột trên Desktop (>= 1024px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Sơ đồ hội trường chế độ ASSIGN */}
        <div className="lg:col-span-8 space-y-4">
          <HallMap
            mode="assign"
            seatGroups={seatGroups}
            groups={groups}
            selectedRows={selectedRows}
            onToggleRow={handleToggleRow}
          />

          <HallLegend groups={groups} seatGroups={seatGroups} />
        </div>

        {/* Cột phải trên Desktop: Panel Chọn nhóm */}
        <div className="hidden lg:block lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] sticky top-24">
          <h3 className="text-[18px] font-bold text-[#0F172A] pb-3 border-b border-[#E2E8F0] mb-4">
            Bảng điều khiển gán chỗ
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
