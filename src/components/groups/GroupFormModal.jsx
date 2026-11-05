import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { Switch } from '../ui/Switch.jsx';
import { ColorSwatchPicker } from '../ui/ColorSwatchPicker.jsx';
import { GROUP_COLOR_PALETTE } from '../../constants/hall.js';
import { GUEST_GROUP_ID } from '../../constants/roles.js';
import { AlertCircle } from 'lucide-react';

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

  const [name, setName] = useState('');
  const [color, setColor] = useState(GROUP_COLOR_PALETTE[0].hex);
  const [checkInRequired, setCheckInRequired] = useState(true);
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setColor(initialData.color || GROUP_COLOR_PALETTE[0].hex);
      setCheckInRequired(
        isSystem ? false : (initialData.checkInRequired !== undefined ? initialData.checkInRequired : true)
      );
      setSelectedBlockIds(initialData.blockIds || []);
    } else {
      setName('');
      setColor(GROUP_COLOR_PALETTE[0].hex);
      setCheckInRequired(true);
      setSelectedBlockIds([]);
    }
    setError('');
  }, [initialData, isOpen, isSystem]);

  // Kiểm tra xung đột khối với nhóm khác
  const blockConflict = useMemo(() => {
    for (const bId of selectedBlockIds) {
      const otherGroup = allGroups.find(
        (g) => g.id !== initialData?.id && Array.isArray(g.blockIds) && g.blockIds.includes(bId)
      );
      if (otherGroup) {
        const blockObj = blocks.find((b) => b.id === bId);
        return `Khối "${blockObj ? blockObj.name : bId}" đã thuộc nhóm "${otherGroup.name}". Một Khối chỉ được thuộc tối đa 1 nhóm.`;
      }
    }
    return null;
  }, [selectedBlockIds, allGroups, initialData, blocks]);

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
      setError('Vui lòng nhập tên nhóm.');
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
      title={isEdit ? `Chỉnh sửa nhóm: ${initialData?.name}` : 'Thêm nhóm mới'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[14px] text-[#B91C1C] font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Tên nhóm ghế"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Khối cơ quan, Khối phân xưởng..."
          disabled={isSystem || loading}
          required
          helperText={
            isSystem
              ? 'Nhóm hệ thống Khách mời không thể đổi tên hoặc gán khối.'
              : ''
          }
        />

        <ColorSwatchPicker
          selectedColor={color}
          onChange={(newColor) => setColor(newColor)}
          disabled={loading}
          label="Màu đại diện trên sơ đồ"
        />

        {/* Công tắc yêu cầu điểm danh */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-1">
          <label className="block text-[16px] font-semibold text-[#0F172A]">
            Yêu cầu điểm danh tại chỗ
          </label>
          <p className="text-[14px] text-[#64748B]">
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

        {/* Khối thuộc nhóm */}
        {!isSystem && (
          <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
            <label className="block text-[16px] font-semibold text-[#0F172A]">
              Khối thuộc nhóm này
            </label>
            <p className="text-[14px] text-[#64748B]">
              Nhân viên thuộc các khối được chọn sẽ tự động thuộc nhóm ghế này.
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-[#E2E8F0] rounded-lg p-2 bg-[#F8FAFC]">
              {blocks.map((b) => {
                const isChecked = selectedBlockIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex items-center gap-3 p-2.5 rounded-md hover:bg-white transition-colors cursor-pointer min-h-[44px] select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleBlock(b.id)}
                      disabled={loading}
                      className="w-5 h-5 rounded border-[#CBD5E1] text-[#008BC5] focus:ring-[#008BC5] cursor-pointer"
                    />
                    <span className="text-[16px] font-medium text-[#0F172A]">
                      {b.name}
                    </span>
                  </label>
                );
              })}
            </div>

            {blockConflict && (
              <div className="p-2.5 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[14px] text-[#B91C1C] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{blockConflict}</span>
              </div>
            )}
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
            disabled={!!blockConflict}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo nhóm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
