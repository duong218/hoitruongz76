import React, { useState, useMemo } from 'react';
import { useOrg } from '../../hooks/useOrg.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Plus, Edit2, Trash2, Users, Building2, GitFork } from 'lucide-react';

export function OrgPage() {
  const {
    blocks,
    departments,
    addBlock,
    updateBlock,
    deleteBlock,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useOrg();
  const { employees } = useEmployees();
  const toast = useToast();
  const { confirm } = useConfirm();

  // Đếm số người của từng Khối và Phòng ban
  const counts = useMemo(() => {
    const bCounts = {};
    const dCounts = {};
    employees.forEach((e) => {
      if (e.blockId) bCounts[e.blockId] = (bCounts[e.blockId] || 0) + 1;
      if (e.departmentId) dCounts[e.departmentId] = (dCounts[e.departmentId] || 0) + 1;
    });
    return { bCounts, dCounts };
  }, [employees]);

  const blockMap = useMemo(() => {
    const map = new Map();
    blocks.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [blocks]);

  // Modal Khối
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockName, setBlockName] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);

  // Modal Phòng ban
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [deptBlockId, setDeptBlockId] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  // Xử lý Khối
  const handleOpenAddBlock = () => {
    setEditingBlock(null);
    setBlockName('');
    setBlockModalOpen(true);
  };

  const handleOpenEditBlock = (b) => {
    setEditingBlock(b);
    setBlockName(b.name);
    setBlockModalOpen(true);
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    try {
      setBlockLoading(true);
      if (editingBlock) {
        await updateBlock(editingBlock.id, { name: blockName });
        toast.success(`Đã cập nhật Khối "${blockName}".`);
      } else {
        await addBlock({ name: blockName });
        toast.success(`Đã thêm mới Khối "${blockName}".`);
      }
      setBlockModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu Khối.');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleDeleteBlock = async (b) => {
    const ok = await confirm({
      title: 'Xóa Khối',
      message: `Bạn có chắc chắn muốn xóa Khối "${b.name}"?`,
      confirmText: 'Xóa Khối',
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });
    if (ok) {
      try {
        await deleteBlock(b.id);
        toast.success(`Đã xóa Khối "${b.name}".`);
      } catch (err) {
        toast.error(err.message || 'Lỗi khi xóa Khối.');
      }
    }
  };

  // Xử lý Phòng ban
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptBlockId(blocks[0]?.id || '');
    setDeptModalOpen(true);
  };

  const handleOpenEditDept = (d) => {
    setEditingDept(d);
    setDeptName(d.name);
    setDeptBlockId(d.blockId || blocks[0]?.id || '');
    setDeptModalOpen(true);
  };

  const handleSaveDept = async (e) => {
    e.preventDefault();
    try {
      setDeptLoading(true);
      if (editingDept) {
        await updateDepartment(editingDept.id, { name: deptName, blockId: deptBlockId });
        toast.success(`Đã cập nhật Phòng ban "${deptName}".`);
      } else {
        await addDepartment({ name: deptName, blockId: deptBlockId });
        toast.success(`Đã thêm mới Phòng ban "${deptName}".`);
      }
      setDeptModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu phòng ban.');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDept = async (d) => {
    const ok = await confirm({
      title: 'Xóa Phòng ban / Phân xưởng',
      message: `Bạn có chắc chắn muốn xóa "${d.name}"?`,
      confirmText: 'Xóa phòng ban',
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });
    if (ok) {
      try {
        await deleteDepartment(d.id);
        toast.success(`Đã xóa phòng ban "${d.name}".`);
      } catch (err) {
        toast.error(err.message || 'Lỗi khi xóa phòng ban.');
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Cơ cấu Tổ chức
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Quản lý danh mục các Khối và Phòng ban. Lưu ý: Ghế hội trường chỉ phân bổ theo <strong>Khối</strong>.
        </p>
      </div>

      {/* PHẦN 1: KHỐI */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-[#008BC5]" />
              <h2 className="text-[20px] font-bold text-[#0F172A]">Danh mục Khối</h2>
            </div>
            <p className="text-[14px] text-[#64748B] mt-0.5">
              Đơn vị quyết định chỗ ngồi hội trường. Nhân viên cùng Khối sẽ cùng ngồi vào nhóm ghế được chỉ định.
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenAddBlock} icon={Plus}>
            Thêm Khối mới
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((b) => {
            const count = counts.bCounts[b.id] || 0;
            return (
              <div
                key={b.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-[18px] font-bold text-[#0F172A]">{b.name}</h3>
                  <div className="flex items-center gap-1.5 text-[15px] text-[#334155] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                    <Users className="w-4 h-4 text-[#64748B]" />
                    <span><strong>{count}</strong> nhân viên trực thuộc</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => handleOpenEditBlock(b)}
                    aria-label={`Sửa ${b.name}`}
                    className="min-h-[44px] min-w-[44px] px-3 py-1 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#008BC5] hover:bg-[#EAF6FF] rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlock(b)}
                    aria-label={`Xóa ${b.name}`}
                    className="min-h-[44px] min-w-[44px] px-3 py-1 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PHẦN 2: PHÒNG BAN */}
      <section className="space-y-4 pt-4 border-t-2 border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#22C55E]" />
              <h2 className="text-[20px] font-bold text-[#0F172A]">Danh mục Phòng ban / Phân xưởng</h2>
            </div>
            <p className="text-[14px] text-[#64748B] mt-0.5">
              Dùng để lọc và tổng hợp báo cáo điểm danh. Mỗi phòng ban gắn với một Khối mặc định.
            </p>
          </div>
          <Button variant="secondary" onClick={handleOpenAddDept} icon={Plus}>
            Thêm Phòng ban mới
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const count = counts.dCounts[d.id] || 0;
            const defaultBlockName = blockMap.get(d.blockId) || 'Chưa gán';

            return (
              <div
                key={d.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-[18px] font-bold text-[#0F172A]">{d.name}</h3>
                  <div className="space-y-1">
                    <span className="text-[13px] text-[#64748B]">Khối mặc định:</span>
                    <div>
                      <Badge variant="neutral">
                        {defaultBlockName}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[15px] text-[#334155] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                    <Users className="w-4 h-4 text-[#64748B]" />
                    <span><strong>{count}</strong> nhân viên</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => handleOpenEditDept(d)}
                    aria-label={`Sửa ${d.name}`}
                    className="min-h-[44px] min-w-[44px] px-3 py-1 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#008BC5] hover:bg-[#EAF6FF] rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDept(d)}
                    aria-label={`Xóa ${d.name}`}
                    className="min-h-[44px] min-w-[44px] px-3 py-1 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#E53E3E] hover:bg-[#FEECEC] rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Khối */}
      <Modal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title={editingBlock ? 'Chỉnh sửa Khối' : 'Thêm Khối cơ quan mới'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBlock} className="space-y-4">
          <Input
            label="Tên Khối"
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
            placeholder="Ví dụ: Khối cơ quan, Khối phân xưởng..."
            required
            autoFocus
          />
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setBlockModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" loading={blockLoading}>
              {editingBlock ? 'Lưu thay đổi' : 'Thêm Khối'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Phòng ban */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Chỉnh sửa Phòng ban' : 'Thêm Phòng ban / Phân xưởng mới'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <Input
            label="Tên Phòng ban / Phân xưởng"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="Ví dụ: Phòng Kế hoạch, Phân xưởng 1..."
            required
            autoFocus
          />

          <Select
            label="Khối mặc định"
            id="dept-block-select"
            value={deptBlockId}
            onChange={(e) => setDeptBlockId(e.target.value)}
            required
            helperText="Khi nhân viên được chọn phòng ban này, Khối của họ sẽ được tự động điền theo Khối mặc định."
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setDeptModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button type="submit" variant="primary" loading={deptLoading}>
              {editingDept ? 'Lưu thay đổi' : 'Thêm Phòng ban'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
