import React, { useState, useRef, useMemo } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2, Trash2, Plus } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { parseEmployeeExcel, revalidateRows, downloadEmployeeTemplate } from '../../utils/excel.js';

export function ImportExcelModal({
  isOpen,
  onClose,
  existingEmployees = [],
  blocks = [],
  departments = [],
  onImportValid,
  onAddBlock,
  onAddDepartment,
}) {
  const [rows, setRows] = useState([]); // các dòng đọc từ Excel, admin được sửa trực tiếp
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [ask, setAsk] = useState(null); // dòng đang hỏi xác nhận tạo Phòng ban / Khối mới
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef(null);

  const existingCodes = existingEmployees.map((e) => e.code);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setLoading(true);
    setFileName(file.name);

    try {
      const parsed = await parseEmployeeExcel(file, existingCodes, blocks, departments);
      setRows(parsed);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi đọc file Excel.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra lại mỗi khi admin sửa dòng nào đó
  const checked = useMemo(
    () => revalidateRows(rows, existingCodes, blocks, departments),
    [rows, existingEmployees, blocks, departments] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const validRows = checked.filter((r) => r.isValid);
  const invalidRows = checked.filter((r) => !r.isValid);

  // Mã xuất hiện từ 2 dòng trở lên trong file -> để cảnh báo rõ dòng nào
  const dupCodes = Object.entries(
    checked.reduce((acc, r) => {
      const k = r.code.trim().toUpperCase();
      if (k) (acc[k] = acc[k] || []).push(r.rowNumber);
      return acc;
    }, {})
  ).filter(([, lines]) => lines.length > 1);

  const updateRow = (rowNumber, field, value) => {
    setAsk(null);
    setRows((prev) => prev.map((r) => (r.rowNumber === rowNumber ? { ...r, [field]: value } : r)));
  };
  const removeRow = (rowNumber) => {
    setAsk(null);
    setRows((prev) => prev.filter((r) => r.rowNumber !== rowNumber));
  };
  const canCreateAny = checked.some((r) => r.createDept || r.createBlock);

  // Xác nhận tạo mới: dùng chính hàm thêm Phòng ban / Khối của hệ thống, danh sách tự tải lại nên dòng tự hết lỗi
  const handleCreateOrg = async () => {
    try {
      setCreating(true);
      if (ask.kind === 'dept') {
        const blk = blocks.find((b) => b.name.toLowerCase() === ask.blockName.toLowerCase());
        await onAddDepartment({ name: ask.name, blockId: blk?.id });
      } else {
        await onAddBlock({ name: ask.name });
      }
      setAsk(null);
    } catch (err) {
      setErrorMsg(err.message || 'Không tạo được. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  };

  const handleExecuteImport = async () => {
    // Chỉ nhập khi tất cả dòng đều hợp lệ
    if (validRows.length === 0 || invalidRows.length > 0) return;
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
    setRows([]);
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

        {/* Xem trước: sửa trực tiếp các dòng lỗi */}
        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-[#E2E8F0] rounded-lg">
              <span className="text-[15px] font-medium text-[#334155]">
                Tìm thấy <strong>{checked.length}</strong> dòng dữ liệu
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

            {invalidRows.length > 0 ? (
              <div role="alert" className="p-3 bg-[#FEF9EE] border border-[#FDE68A] rounded-lg text-[14px] text-[#B45309] space-y-1">
                <p className="flex items-start gap-2 font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Còn {invalidRows.length} dòng cần sửa. Hãy sửa trực tiếp trong bảng, hoặc bỏ dòng không cần nhập. Nút nhập sẽ hiện khi tất cả dòng đều hợp lệ.
                  </span>
                </p>
                {canCreateAny && (
                  <p className="pl-7">
                    Phòng ban hoặc Khối chưa có trên hệ thống: bấm dấu <strong>+</strong> cạnh ô để tạo mới. Nếu thiếu cả hai thì phải sửa lại tên.
                  </p>
                )}
                {dupCodes.length > 0 && (
                  <p className="pl-7">
                    Mã bị trùng trong file: {dupCodes.map(([code, lines]) => `${code} (dòng ${lines.join(', ')})`).join('; ')}.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#ECFDF5] border border-[#BBF7D0] rounded-lg text-[14px] font-medium text-[#15803D] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Tất cả dòng đều hợp lệ, có thể nhập vào hệ thống.</span>
              </div>
            )}

            <datalist id="import-depts">
              {departments.map((d) => <option key={d.id} value={d.name} />)}
            </datalist>
            <datalist id="import-blocks">
              {blocks.map((b) => <option key={b.id} value={b.name} />)}
            </datalist>

            {/* Bảng xem trước (sửa được) */}
            <div className="max-h-96 overflow-auto border border-[#E2E8F0] rounded-lg">
              <table className="w-full min-w-[900px] text-left border-collapse text-[14px]">
                <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b border-[#E2E8F0]">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Dòng</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Mã NV</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Họ và tên</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Phòng ban</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Khối</th>
                    <th className="py-2.5 px-3 font-bold text-[#475569]">Trạng thái</th>
                    <th className="py-2.5 px-3"><span className="sr-only">Bỏ dòng</span></th>
                  </tr>
                </thead>
                <tbody>
                  {checked.map((r) => (
                    <tr key={r.rowNumber} className={`border-b border-[#E2E8F0] ${r.isValid ? 'bg-white' : 'bg-[#FEECEC]'}`}>
                      <td className="py-1.5 px-3 font-mono text-[#475569]">{r.rowNumber}</td>
                      <td className="py-1.5 px-2 w-36">
                        <CellInput mono value={r.code} invalid={!r.isValid} label={`Mã NV dòng ${r.rowNumber}`} onChange={(v) => updateRow(r.rowNumber, 'code', v)} />
                      </td>
                      <td className="py-1.5 px-2">
                        <CellInput value={r.name} invalid={!r.isValid} label={`Họ và tên dòng ${r.rowNumber}`} onChange={(v) => updateRow(r.rowNumber, 'name', v)} />
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <CellInput list="import-depts" placeholder="Chưa có" value={r.departmentName} invalid={!r.isValid} label={`Phòng ban dòng ${r.rowNumber}`} onChange={(v) => updateRow(r.rowNumber, 'departmentName', v)} />
                          {r.createDept && (
                            <PlusButton
                              label={`Tạo phòng ban mới "${r.departmentName.trim()}"`}
                              onClick={() => setAsk({ rowNumber: r.rowNumber, kind: 'dept', name: r.departmentName.trim(), blockName: r.blockName.trim() })}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex items-center gap-1">
                          <CellInput list="import-blocks" placeholder="Mặc định" value={r.blockName} invalid={!r.isValid} label={`Khối dòng ${r.rowNumber}`} onChange={(v) => updateRow(r.rowNumber, 'blockName', v)} />
                          {r.createBlock && (
                            <PlusButton
                              label={`Tạo Khối mới "${r.blockName.trim()}"`}
                              onClick={() => setAsk({ rowNumber: r.rowNumber, kind: 'block', name: r.blockName.trim() })}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 px-3 font-medium">
                        {r.isValid ? (
                          <span className="text-[#15803D]">Hợp lệ</span>
                        ) : ask?.rowNumber === r.rowNumber ? (
                          <div className="space-y-2 text-[#0F172A]">
                            <p>
                              {ask.kind === 'dept'
                                ? `Tạo phòng ban mới "${ask.name}" thuộc "${ask.blockName}"?`
                                : `Tạo Khối mới "${ask.name}"?`}
                            </p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="primary" loading={creating} onClick={handleCreateOrg}>
                                Tạo mới
                              </Button>
                              <Button size="sm" variant="secondary" disabled={creating} onClick={() => setAsk(null)}>
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold text-[#B91C1C]">Lỗi: {r.error}</span>
                            {(r.createDept || r.createBlock) && (
                              <span className="block text-[13px] text-[#B45309]">
                                Nếu là {r.createDept ? 'phòng ban' : 'Khối'} mới, bấm dấu + để tạo.
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-1.5 px-2">
                        <button
                          type="button"
                          onClick={() => removeRow(r.rowNumber)}
                          aria-label={`Bỏ dòng ${r.rowNumber} khỏi danh sách nhập`}
                          title="Bỏ dòng này khỏi danh sách nhập"
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#64748B] hover:text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
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
          {rows.length > 0 && invalidRows.length === 0 && (
            <Button variant="primary" onClick={handleExecuteImport} disabled={importing} loading={importing}>
              {`Nhập ${validRows.length} người`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CellInput({ value, onChange, label, invalid, list, placeholder, mono }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      list={list}
      placeholder={placeholder}
      className={`w-full min-h-[40px] px-2.5 py-1.5 text-[14px] text-[#0F172A] rounded-md border focus:outline-none focus:ring-2 focus:ring-[#008BC5] ${
        mono ? 'font-mono font-semibold' : ''
      } ${invalid ? 'bg-white border-[#FECACA]' : 'bg-transparent border-transparent hover:border-[#CBD5E1] focus:bg-white'}`}
    />
  );
}

function PlusButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md border border-[#008BC5] bg-white text-[#008BC5] hover:bg-[#EAF6FF] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
    >
      <Plus className="w-5 h-5" />
    </button>
  );
}