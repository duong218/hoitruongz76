import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, Check } from 'lucide-react';
import { employeeService } from '../../services/employeeService.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

export function EmployeeChangeNotice() {
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    employeeService.getChangeLogs().then(setLogs).catch(() => {});
  }, []);

  if (!logs.length) return null;

  const handleClear = async () => {
    try {
      setClearing(true);
      await employeeService.clearChangeLogs();
      setLogs([]);
      setOpen(false);
    } catch {
      // bỏ qua lỗi nhỏ khi xóa thông báo
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#FEF9EE] border border-[#FDE68A] text-[#92400E]">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
          <p className="text-[14px] font-semibold">
            Có sự thay đổi cập nhật thông tin nhân viên ({logs.length} lượt cập nhật).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#F59E0B] text-[#B45309] text-[13px] font-bold hover:bg-[#FFFBEB] cursor-pointer shrink-0"
        >
          <Eye className="w-4 h-4" />
          Xem chi tiết
        </button>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Chi tiết cập nhật thông tin nhân viên"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-auto border border-[#E2E8F0] rounded-lg">
            <table className="w-full min-w-[680px] text-left border-collapse text-[14px]">
              <thead className="bg-[#F8FAFC] sticky top-0 border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-2.5 px-3 font-bold text-[#475569]">Mã NV</th>
                  <th className="py-2.5 px-3 font-bold text-[#475569]">Họ và tên</th>
                  <th className="py-2.5 px-3 font-bold text-[#475569]">Phòng ban</th>
                  <th className="py-2.5 px-3 font-bold text-[#475569]">Khối</th>
                  <th className="py-2.5 px-3 font-bold text-[#475569]">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {logs.map((item) => (
                  <tr key={item.id} className="bg-white">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">{item.employeeCode}</td>
                    <td className="py-2.5 px-3">
                      {item.oldName && item.newName ? (
                        <span>
                          <span className="line-through text-[#94A3B8]">{item.oldName}</span>{' '}
                          <span className="font-semibold text-[#0F172A]">→ {item.newName}</span>
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Không đổi</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.oldDept || item.newDept ? (
                        <span>
                          <span className="line-through text-[#94A3B8]">{item.oldDept}</span>{' '}
                          <span className="font-semibold text-[#0F172A]">→ {item.newDept}</span>
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Không đổi</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.oldBlock || item.newBlock ? (
                        <span>
                          <span className="line-through text-[#94A3B8]">{item.oldBlock}</span>{' '}
                          <span className="font-semibold text-[#0F172A]">→ {item.newBlock}</span>
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Không đổi</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[13px] text-[#64748B] whitespace-nowrap">
                      {new Date(item.changedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#E2E8F0]">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button variant="primary" icon={Check} loading={clearing} onClick={handleClear}>
              Đã xem (Ẩn thông báo)
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
