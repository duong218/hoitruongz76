import React, { useRef, useState } from 'react';
import { backupService } from '../../services/backupService.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Download, Upload, RotateCcw, AlertCircle, Database, ShieldCheck } from 'lucide-react';

export function MaintenancePage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const fileInputRef = useRef(null);
  const [restoring, setRestoring] = useState(false);

  // 1. Sao lưu
  const handleExport = () => {
    try {
      backupService.exportBackup();
      toast.success('Đã xuất file sao lưu JSON thành công.');
    } catch {
      toast.error('Lỗi khi tải file sao lưu.');
    }
  };

  // 2. Khôi phục từ JSON
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoring(true);
      const text = await file.text();

      const ok = await confirm({
        title: 'Khôi phục dữ liệu từ tệp',
        message: `Bạn đang chuẩn bị khôi phục dữ liệu từ tệp "${file.name}".\n\nHành động này sẽ ghi đè toàn bộ danh sách khối, phòng ban, nhân viên, nhóm ghế và điểm danh hiện tại. Bạn có chắc chắn muốn thực hiện không?`,
        confirmText: 'Ghi đè & Khôi phục',
        cancelText: 'Hủy bỏ',
        isDanger: true,
      });

      if (ok) {
        await backupService.restoreBackup(text);
        toast.success('Khôi phục dữ liệu thành công.');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi khôi phục dữ liệu.');
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Đặt lại dữ liệu mẫu
  const handleResetDemo = async () => {
    const ok = await confirm({
      title: 'Đặt lại dữ liệu mẫu ban đầu',
      message: 'Toàn bộ dữ liệu hiện tại sẽ bị xóa và thay thế bằng bộ dữ liệu mẫu Z176 chuẩn (gồm 4 khối, 5 phòng ban, 8 nhân sự, 5 nhóm ghế và dữ liệu điểm danh mẫu).\n\nHành động này không thể hoàn tác.',
      confirmText: 'Đặt lại dữ liệu',
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });

    if (ok) {
      try {
        await backupService.resetToDemoData();
        toast.success('Đã đặt lại dữ liệu mẫu ban đầu thành công.');
      } catch {
        toast.error('Lỗi khi thiết lập lại dữ liệu mẫu.');
      }
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Bảo trì & Sao lưu Dữ liệu
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Quản lý an toàn dữ liệu hệ thống, sao lưu định kỳ và khôi phục khi cần thiết.
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <div className="space-y-4">
        {/* Nút 1: Sao lưu */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
              <Download className="w-5 h-5 text-[#008BC5]" />
              <span>Sao lưu dữ liệu</span>
            </h3>
            <p className="text-[15px] text-[#64748B]">
              Tải file JSON toàn bộ cơ cấu khối, phòng ban, nhân sự, nhóm ghế và điểm danh về máy tính.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleExport}
            icon={Download}
            className="shrink-0"
          >
            Tải bản sao lưu (.json)
          </Button>
        </div>

        {/* Nút 2: Khôi phục */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#22C55E]" />
              <span>Khôi phục từ file sao lưu</span>
            </h3>
            <p className="text-[15px] text-[#64748B]">
              Chọn tệp JSON sao lưu hợp lệ từ máy tính để khôi phục lại trạng thái hệ thống.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            loading={restoring}
            icon={Upload}
            className="shrink-0"
          >
            Chọn file khôi phục
          </Button>
        </div>

        {/* Nút 3: Đặt lại dữ liệu mẫu */}
        <div className="bg-white border border-[#FECACA] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-[#FEECEC]/20">
          <div className="space-y-1">
            <h3 className="text-[18px] font-bold text-[#B91C1C] flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#E53E3E]" />
              <span>Đặt lại dữ liệu mẫu</span>
            </h3>
            <p className="text-[15px] text-[#64748B]">
              Xóa toàn bộ chỉnh sửa hiện tại và nạp lại dữ liệu mẫu chuẩn ban đầu của ban tổ chức Z176.
            </p>
          </div>
          <Button
            variant="danger"
            onClick={handleResetDemo}
            icon={RotateCcw}
            className="shrink-0"
          >
            Đặt lại dữ liệu mẫu
          </Button>
        </div>
      </div>
    </div>
  );
}
