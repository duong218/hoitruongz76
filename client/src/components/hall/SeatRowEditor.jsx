import React, { useState, useEffect } from 'react';
import { SEATS_PER_SIDE, seatId } from '../../constants/hall.js';
import { Modal } from '../ui/Modal.jsx';
import { BottomSheet } from '../ui/BottomSheet.jsx';
import { Button } from '../ui/Button.jsx';
import { SeatPreviewMap } from './SeatPreviewMap.jsx';
import { Check, XCircle } from 'lucide-react';

export function SeatRowEditor({
  isOpen,
  onClose,
  row,
  seatGroups = {},
  groups = [],
  onAssignSeats,
}) {
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset selection when row changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSeatIds([]);
    }
  }, [isOpen, row]);

  if (!isOpen || !row) return null;

  const leftSeatIds = Array.from({ length: SEATS_PER_SIDE }, (_, i) => seatId(row, 'L', i + 1));
  const rightSeatIds = Array.from({ length: SEATS_PER_SIDE }, (_, i) => seatId(row, 'R', i + 1));

  const toggleSeat = (sId) => {
    setSelectedSeatIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const selectSide = (side) => {
    const targetIds = side === 'L' ? leftSeatIds : rightSeatIds;
    setSelectedSeatIds((prev) => Array.from(new Set([...prev, ...targetIds])));
  };

  const handleApplyGroup = (groupId) => {
    if (selectedSeatIds.length === 0) return;
    onAssignSeats(selectedSeatIds, groupId);
    setSelectedSeatIds([]);
  };

  const getSeatGroup = (sId) => {
    const gId = seatGroups[sId];
    if (!gId) return null;
    return groups.find((g) => g.id === gId) || null;
  };

  const renderSeatGrid = (sideTitle, sideCode, seatList) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[16px] font-bold text-[#0F172A]">{sideTitle}</h4>
        <button
          type="button"
          onClick={() => selectSide(sideCode)}
          className="text-[14px] font-semibold text-[#008BC5] hover:underline cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-end"
        >
          Chọn cả {sideTitle.toLowerCase()}
        </button>
      </div>

      {/* Lưới 5 cột x 2 dòng, ghế >= 48x48px */}
      <div className="grid grid-cols-5 gap-2">
        {seatList.map((sId) => {
          const parts = sId.split('-');
          const n = parts[2];
          const isSelected = selectedSeatIds.includes(sId);
          const currentGroup = getSeatGroup(sId);

          return (
            <button
              key={sId}
              type="button"
              onClick={() => toggleSeat(sId)}
              className={`h-12 min-h-[48px] rounded-lg border flex flex-col items-center justify-center relative transition-all cursor-pointer select-none ${
                isSelected
                  ? 'border-[#008BC5] ring-2 ring-[#008BC5] bg-[#EAF6FF]'
                  : 'border-[#CBD5E1] bg-white hover:bg-[#F6F8FA]'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[15px] font-bold text-[#0F172A]">G.{n}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#008BC5] stroke-[3]" />}
              </div>
              {/* Vạch màu nhóm */}
              <div
                className="w-4 h-1.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: currentGroup ? currentGroup.color : '#CBD5E1',
                }}
              />
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-[#64748B]">Ghế 1 sát lối đi, ghế 10 sát tường</p>
    </div>
  );

  const content = (
    <div className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_14rem] lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_22rem] sm:gap-6 sm:items-start">
      {/* Xem trước vị trí ghế đang chọn: dính trên cùng khi cuộn (điện thoại) / cột phải (máy tính) */}
      <aside className="order-1 sm:order-2 sticky top-0 z-10 bg-white pb-3 sm:pb-0 w-full max-w-xs mx-auto sm:max-w-none">
        <SeatPreviewMap row={row} selectedSeatIds={selectedSeatIds} seatGroups={seatGroups} groups={groups} />
        <div className="hidden sm:block mt-3">
          <Button variant="primary" fullWidth onClick={onClose}>
            Xong
          </Button>
        </div>
      </aside>

      <div className="order-2 sm:order-1 space-y-6 min-w-0">
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-[15px] text-[#334155] leading-snug">
        Đang chỉnh: <strong className="text-[#0F172A]">Hàng {row}</strong> ({row <= 2 ? 'Hàng VIP' : 'Hàng tiêu chuẩn'}).
        Bấm chọn một hoặc nhiều ghế rồi chọn nhóm bên dưới để gán.
      </div>

      <div className="space-y-5 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6">
        {renderSeatGrid('Bên trái', 'L', leftSeatIds)}
        {renderSeatGrid('Bên phải', 'R', rightSeatIds)}
      </div>

      {/* Bảng gán nhóm cho các ghế đang chọn */}
      <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-bold text-[#0F172A]">
            Gán cho {selectedSeatIds.length} ghế đang chọn:
          </span>
          {selectedSeatIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedSeatIds([])}
              className="text-[14px] text-[#64748B] hover:text-[#0F172A] min-h-[44px] flex items-center"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              disabled={selectedSeatIds.length === 0}
              onClick={() => handleApplyGroup(group.id)}
              className="min-h-[48px] px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg flex items-center justify-between hover:bg-[#F6F8FA] active:bg-[#EAF6FF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-[15px] font-medium text-[#0F172A] truncate">
                  {group.name}
                </span>
              </div>
              <span className="text-[13px] font-semibold text-[#008BC5] shrink-0">
                Gán
              </span>
            </button>
          ))}

          {/* Nút Bỏ gán */}
          <button
            type="button"
            disabled={selectedSeatIds.length === 0}
            onClick={() => handleApplyGroup(null)}
            className="min-h-[48px] px-3 py-2 bg-white border border-[#E53E3E]/30 rounded-lg flex items-center justify-between hover:bg-[#FEECEC] active:bg-[#FECACA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left cursor-pointer text-[#E53E3E]"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span className="text-[15px] font-medium">Bỏ gán các ghế chọn</span>
            </div>
          </button>
        </div>
      </div>

      {/* Nút Xong (điện thoại; máy tính dùng nút dưới sơ đồ) */}
      <div className="pt-2 sm:hidden">
        <Button variant="primary" fullWidth onClick={onClose}>
          Xong
        </Button>
      </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={`Chỉnh từng ghế - Hàng ${row}`}
      >
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chỉnh từng ghế - Hàng ${row}`}
      maxWidth="max-w-3xl lg:max-w-5xl xl:max-w-6xl"
    >
      {content}
    </Modal>
  );
}