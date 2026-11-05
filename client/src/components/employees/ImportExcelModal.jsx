import React, { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { parseEmployeeExcel, downloadEmployeeTemplate } from '../../utils/excel.js';

export function ImportExcelModal({
  isOpen,
  onClose,
  existingEmployees = [],
  blocks = [],
  departments = [],
  onImportValid,
}) {
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const existingCodes = existingEmployees.map((e) => e.code);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setLoading(true);
    setFileName(file.name);

    try {
      const rows = await parseEmployeeExcel(file, existingCodes, blocks, departments);
      setParsedRows(rows);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi đọc file Excel.');
      setParsedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;
    try {
      setImporting(true);
      const rowsToImport = validRows.map((r) => r.parsed);
      await onImportValid(rowsToImport);
      handleClose();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi nhập dữ liệu vào hệ thống.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsedRows([]);
    setFileName('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập danh sách nhân viên từ Excel"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Hướng dẫn và Nút tải file mẫu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div>
            <h4 className="text-[16px] font-bold text-[#0F172A]">Định dạng tệp Excel chuẩn</h4>
            <p className="text-[14px] text-[#64748B] mt-0.5">
              Cột yêu cầu: <strong>Mã NV, Họ và tên, Phòng ban, Khối, Vai trò</strong>. Bỏ trống Khối sẽ tự lấy theo Khối mặc định của phòng ban.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadEmployeeTemplate(blocks, departments)}
            icon={Download}
          >
            Tải file mẫu .xlsx
          </Button>
        </div>

        {/* Khu vực chọn file */}
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
            id="excel-file-upload"
          />
          <label
            htmlFor="excel-file-upload"
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#008BC5] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white hover:bg-[#F6F8FA] min-h-[120px]"
          >
            <Upload className="w-8 h-8 text-[#008BC5] mb-2" />
            <span className="text-[16px] font-bold text-[#0F172A]">
              {fileName ? `Đã chọn: ${fileName}` : 'Bấm vào đây để chọn tệp .xlsx từ máy tính'}
            </span>
            <span className="text-[14px] text-[#64748B] mt-1">
              Chấp nhận các định dạng bảng tính Microsoft Excel (.xlsx)
            </span>
          </label>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[14px] text-[#B91C1C] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Thống kê dữ liệu đã phân tích */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[15px] font-medium text-[#334155]">
                Tìm thấy <strong>{parsedRows.length}</strong> dòng dữ liệu
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="success" icon={CheckCircle2}>
                  {validRows.length} hợp lệ
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="error" icon={AlertCircle}>
                    {invalidRows.length} dòng lỗi
                  </Badge>
                )}
              </div>
            </div>

            {/* Bảng xem trước */}
            <div className="max-h-72 overflow-y-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead className="bg-[#F8FAFC] sticky top-0 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Dòng</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Mã NV</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Họ và tên</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Phòng ban</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Khối</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b border-[#E2E8F0] ${
                        r.isValid ? 'bg-white' : 'bg-[#FEECEC] text-[#B91C1C]'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono">{r.rowNumber}</td>
                      <td className="py-2 px-3 font-bold font-mono">{r.code || '—'}</td>
                      <td className="py-2 px-3">{r.name || '—'}</td>
                      <td className="py-2 px-3">{r.departmentName || 'Chưa có'}</td>
                      <td className="py-2 px-3">{r.blockName || 'Mặc định'}</td>
                      <td className="py-2 px-3 font-medium">
                        {r.isValid ? (
                          <span className="text-[#15803D]">Hợp lệ</span>
                        ) : (
                          <span className="font-semibold text-[#B91C1C]">
                            Lỗi: {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <Button variant="secondary" onClick={handleClose} disabled={importing}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleExecuteImport}
            disabled={validRows.length === 0 || importing}
            loading={importing}
          >
            {`Nhập ${validRows.length} người hợp lệ`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
