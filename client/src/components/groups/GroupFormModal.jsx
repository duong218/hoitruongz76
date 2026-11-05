import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Switch } from '../ui/Switch.jsx';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker.jsx';
import { GROUP_COLOR_PALETTE } from '../../constants/hall.js';
import { GUEST_GROUP_ID } from '../../constants/roles.js';
import { AlertCircle, Check, Layers, Sparkles } from 'lucide-react';

export function GroupFormModal({
  isOpen,
  onClose,
  initialData = null,
  allGroups = [],
  blocks = [],
  onSubmit,
}) {
  const isEdit = !!initialData;
  const isSystem = initialData?.isSystem || initialData?.id === GUEST_GROUP_ID;

  const [mode, setMode] = useState('quick'); // 'quick' (chọn khối có sẵn) | 'custom' (tùy chỉnh nâng cao)
  const [name, setName] = useState('');
  const [color, setColor] = useState(GROUP_COLOR_PALETTE[0].hex);
  const [checkInRequired, setCheckInRequired] = useState(true);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Map khối nào đã được nhóm khác sử dụng
  const blockUsageMap = useMemo(() => {
    const map = new Map();
    allGroups.forEach((g) => {
      if (g.id !== initialData?.id && Array.isArray(g.blockIds)) {
        g.blockIds.forEach((bId) => {
          map.set(bId, g.name);
        });
      }
    });
    return map;
  }, [allGroups, initialData]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setColor(initialData.color || GROUP_COLOR_PALETTE[0].hex);
      setCheckInRequired(
        isSystem ? false : (initialData.checkInRequired !== undefined ? initialData.checkInRequired : true)
      );
      setSelectedBlockIds(initialData.blockIds || []);
      setMode('custom'); // Khi sửa nhóm mở chế độ chi tiết
    } else {
      setName('');
      // Chọn màu tiếp theo chưa dùng nếu có
      const usedColors = new Set(allGroups.map((g) => g.color?.toLowerCase()));
      const availableColor = GROUP_COLOR_PALETTE.find((c) => !usedColors.has(c.hex.toLowerCase()));
      setColor(availableColor ? availableColor.hex : GROUP_COLOR_PALETTE[0].hex);
      setCheckInRequired(true);
      setSelectedBlockIds([]);
      setMode('quick');
    }
    setError('');
  }, [initialData, isOpen, isSystem, allGroups]);

  // Khi ở chế độ quick: chọn 1 Khối có sẵn -> tự động điền Tên nhóm và gán Khối đó
  const handleQuickSelectBlock = (block) => {
    if (blockUsageMap.has(block.id)) return; // Khối đã có nhóm
    setName(block.name);
    setSelectedBlockIds([block.id]);
    setError('');
  };

  // Kiểm tra xung đột khối với nhóm khác
  const blockConflict = useMemo(() => {
    for (const bId of selectedBlockIds) {
      const otherGroupName = blockUsageMap.get(bId);
      if (otherGroupName) {
        const blockObj = blocks.find((b) => b.id === bId);
        return `Khối "${blockObj ? blockObj.name : bId}" đã thuộc nhóm "${otherGroupName}". Mỗi khối chỉ được gán vào 1 nhóm ghế.`;
      }
    }
    return null;
  }, [selectedBlockIds, blockUsageMap, blocks]);

  const toggleBlock = (bId) => {
    setSelectedBlockIds((prev) =>
      prev.includes(bId) ? prev.filter((id) => id !== bId) : [...prev, bId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vui lòng nhập hoặc chọn một Khối để đặt tên nhóm.');
      return;
    }
    if (!color) {
      setError('Vui lòng chọn màu đại diện cho nhóm.');
      return;
    }
    if (blockConflict) {
      setError(blockConflict);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        name: trimmedName,
        color,
        checkInRequired: isSystem ? false : checkInRequired,
        blockIds: isSystem ? [] : selectedBlockIds,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu nhóm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa nhóm: ${initialData?.name}` : 'Thêm nhóm ghế hội trường'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[14px] text-[#B91C1C] font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Chuyển đổi chế độ khi tạo mới: Chọn nhanh từ khối hay Tự tạo riêng */}
        {!isEdit && !isSystem && (
          <div className="flex p-1 bg-[#F1F5F9] rounded-lg">
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[14px] font-semibold transition-all ${
                mode === 'quick'
                  ? 'bg-white text-[#008BC5] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Lấy từ Khối có sẵn (Nhanh)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[14px] font-semibold transition-all ${
                mode === 'custom'
                  ? 'bg-white text-[#008BC5] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tùy chỉnh nhóm riêng</span>
            </button>
          </div>
        )}

        {/* Chế độ Chọn nhanh: Chỉ cần click vào Khối chưa gán */}
        {!isEdit && !isSystem && mode === 'quick' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-1">
                1. Chọn Khối muốn tạo nhóm ghế <span className="text-[#DC2626]">*</span>
              </label>
              <p className="text-[13px] text-[#64748B]">
                Hệ thống sẽ tự động đặt tên nhóm theo Khối đã chọn và gán toàn bộ nhân viên Khối đó vào nhóm ghế này.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {blocks.map((b) => {
                const isAssigned = blockUsageMap.has(b.id);
                const isSelected = selectedBlockIds.includes(b.id);
                const assignedGroupName = blockUsageMap.get(b.id);

                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={isAssigned || loading}
                    onClick={() => handleQuickSelectBlock(b)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between min-h-[52px] ${
                      isSelected
                        ? 'border-[#008BC5] bg-[#E0F2FE] ring-2 ring-[#008BC5]'
                        : isAssigned
                        ? 'border-[#E2E8F0] bg-[#F8FAFC] opacity-60 cursor-not-allowed'
                        : 'border-[#CBD5E1] bg-white hover:border-[#008BC5] hover:bg-[#F0F9FF]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-[14px] font-bold text-[#0F172A] truncate">
                        {b.name}
                      </div>
                      <div className="text-[12px] text-[#64748B] truncate">
                        {isAssigned ? `Đã thuộc nhóm: ${assignedGroupName}` : 'Chưa có nhóm ghế'}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#008BC5] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {name && (
              <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-[13px] text-[#166534] font-medium flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-[#16A34A]" />
                <span>Đã chọn: <strong>{name}</strong> (Tên nhóm ghế sẽ được đặt là <strong>"{name}"</strong>)</span>
              </div>
            )}
          </div>
        ) : (
          /* Chế độ Chi tiết / Chỉnh sửa: Nhập tên tùy ý */
          <div className="space-y-4">
            <Input
              label="Tên nhóm ghế"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Khối cơ quan, Trưởng ban & Khách VIP..."
              disabled={isSystem || loading}
              required
              helperText={
                isSystem
                  ? 'Nhóm hệ thống Khách mời không thể đổi tên hoặc gán khối.'
                  : ''
              }
            />

            {!isSystem && (
              <div className="space-y-2">
                <label className="block text-[15px] font-semibold text-[#0F172A]">
                  Khối thuộc nhóm này
                </label>
                <p className="text-[13px] text-[#64748B]">
                  Nhân viên thuộc các khối được tích chọn sẽ tự động thuộc nhóm ghế này.
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-[#CBD5E1] rounded-lg p-2 bg-[#F8FAFC]">
                  {blocks.map((b) => {
                    const isChecked = selectedBlockIds.includes(b.id);
                    const isUsedByOther = blockUsageMap.has(b.id) && !isChecked;
                    const otherGroup = blockUsageMap.get(b.id);

                    return (
                      <label
                        key={b.id}
                        className={`flex items-center justify-between p-2.5 rounded-md transition-colors min-h-[44px] select-none ${
                          isUsedByOther
                            ? 'opacity-50 cursor-not-allowed bg-transparent'
                            : 'cursor-pointer hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBlock(b.id)}
                            disabled={loading || isUsedByOther}
                            className="w-5 h-5 rounded border-[#CBD5E1] text-[#008BC5] focus:ring-[#008BC5] cursor-pointer"
                          />
                          <span className="text-[15px] font-medium text-[#0F172A]">
                            {b.name}
                          </span>
                        </div>
                        {isUsedByOther && (
                          <span className="text-[12px] text-[#94A3B8] italic">
                            (Đã ở nhóm {otherGroup})
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Chọn màu đại diện */}
        <div className="pt-2 border-t border-[#E2E8F0]">
          <ColorSwatchPicker
            selectedColor={color}
            onChange={(newColor) => setColor(newColor)}
            disabled={loading}
            label={!isEdit && mode === 'quick' ? '2. Chọn màu sắc đại diện trên sơ đồ ghế *' : 'Màu đại diện trên sơ đồ *'}
          />
        </div>

        {/* 3. Công tắc yêu cầu điểm danh */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
          <label className="block text-[15px] font-semibold text-[#0F172A]">
            Yêu cầu điểm danh tại chỗ
          </label>
          <p className="text-[13px] text-[#64748B]">
            {isSystem
              ? 'Khách mời được miễn điểm danh theo quy định.'
              : 'Nếu bật, thành viên thuộc nhóm này bắt buộc phải quét mã QR trên ghế để xác nhận có mặt.'}
          </p>
          <div className="pt-1">
            <Switch
              checked={checkInRequired}
              onChange={(val) => setCheckInRequired(val)}
              disabled={isSystem || loading}
              label="Trạng thái:"
            />
          </div>
        </div>

        {blockConflict && (
          <div className="p-2.5 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[13px] text-[#B91C1C] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{blockConflict}</span>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!!blockConflict || !name.trim()}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo nhóm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
