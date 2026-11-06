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
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Plus, Edit2, Trash2, Users, Building2, GitFork, AlertCircle } from 'lucide-react';

const PAGE_SIZE = 10;

export function OrgPage() {
  const {
    blocks,
    departments,
    loading,
    error,
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

  // Tab Khối / Phòng ban, mỗi tab phân trang riêng
  const [tab, setTab] = useState('block');
  const [blockPage, setBlockPage] = useState(1);
  const [deptPage, setDeptPage] = useState(1);
  const bPages = Math.max(1, Math.ceil(blocks.length / PAGE_SIZE));
  const dPages = Math.max(1, Math.ceil(departments.length / PAGE_SIZE));
  const bPage = Math.min(blockPage, bPages);
  const dPage = Math.min(deptPage, dPages);
  const tabs = [
    { key: 'block', label: 'Khối', icon: GitFork },
    { key: 'dept', label: 'Phòng ban / Phân xưởng', icon: Building2 },
  ];

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
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Cơ cấu Tổ chức
        </h1>
        <p className="text-[15px] text-[#64748B] mt-1">
          Quản lý danh mục Khối và Phòng ban. Ghế hội trường chỉ phân bổ theo <strong className="text-[#334155]">Khối</strong>.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[14px] font-medium text-[#B91C1C]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div role="tablist" className="inline-flex flex-wrap p-1 gap-1 bg-[#F1F5F9] rounded-xl">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-[44px] px-4 inline-flex items-center gap-2 text-[15px] font-semibold rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008BC5] ${
              tab === key ? 'bg-white text-[#008BC5] shadow-[0_1px_3px_rgba(15,23,42,0.1)]' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* KHỐI */}
      {tab === 'block' && (
      <div className="space-y-4">
      <OrgSection
        icon={GitFork}
        title="Danh mục Khối"
        count={blocks.length}
        description="Quyết định chỗ ngồi hội trường: nhân viên cùng Khối ngồi chung nhóm ghế."
        action={<Button variant="primary" size="sm" onClick={handleOpenAddBlock} icon={Plus}>Thêm Khối</Button>}
        loading={loading}
        isEmpty={blocks.length === 0}
        empty={{ icon: GitFork, title: 'Chưa có Khối nào', description: 'Tạo Khối đầu tiên để bắt đầu phân bổ chỗ ngồi.', actionText: 'Thêm Khối', onAction: handleOpenAddBlock, actionIcon: Plus }}
      >
        {blocks.slice((bPage - 1) * PAGE_SIZE, bPage * PAGE_SIZE).map((b) => (
          <OrgRow
            key={b.id}
            name={b.name}
            count={counts.bCounts[b.id] || 0}
            onEdit={() => handleOpenEditBlock(b)}
            onDelete={() => handleDeleteBlock(b)}
          />
        ))}
      </OrgSection>
      <Pagination page={bPage} pages={bPages} total={blocks.length} limit={PAGE_SIZE} onChange={setBlockPage} />
      </div>
      )}

      {/* PHÒNG BAN */}
      {tab === 'dept' && (
      <div className="space-y-4">
      <OrgSection
        icon={Building2}
        title="Phòng ban / Phân xưởng"
        count={departments.length}
        description="Dùng để lọc và tổng hợp báo cáo điểm danh. Mỗi phòng ban thuộc một Khối mặc định."
        action={<Button variant="primary" size="sm" onClick={handleOpenAddDept} icon={Plus} disabled={blocks.length === 0}>Thêm Phòng ban</Button>}
        loading={loading}
        isEmpty={departments.length === 0}
        empty={{ icon: Building2, title: 'Chưa có Phòng ban nào', description: blocks.length === 0 ? 'Hãy tạo Khối trước, sau đó thêm Phòng ban.' : 'Thêm Phòng ban để lọc và tổng hợp báo cáo.', actionText: blocks.length === 0 ? undefined : 'Thêm Phòng ban', onAction: handleOpenAddDept, actionIcon: Plus }}
      >
        {departments.slice((dPage - 1) * PAGE_SIZE, dPage * PAGE_SIZE).map((d) => (
          <OrgRow
            key={d.id}
            name={d.name}
            tag={blockMap.get(d.blockId) || 'Chưa gán Khối'}
            tagWarn={!blockMap.get(d.blockId)}
            count={counts.dCounts[d.id] || 0}
            onEdit={() => handleOpenEditDept(d)}
            onDelete={() => handleDeleteDept(d)}
          />
        ))}
      </OrgSection>
      <Pagination page={dPage} pages={dPages} total={departments.length} limit={PAGE_SIZE} onChange={setDeptPage} />
      </div>
      )}

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


/* ---------- Thành phần giao diện cục bộ của trang ---------- */

function OrgSection({ icon: Icon, title, count, description, action, loading, isEmpty, empty, children }) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 rounded-lg bg-[#EAF6FF] text-[#008BC5] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-[#0F172A]">{title}</h2>
              <span className="min-w-[24px] px-2 py-0.5 text-center text-[13px] font-semibold tabular-nums rounded-full bg-[#F1F5F9] text-[#475569]">
                {count}
              </span>
            </div>
            <p className="text-[14px] text-[#64748B] mt-0.5">{description}</p>
          </div>
        </div>
        <div className="shrink-0">{action}</div>
      </header>

      {loading ? (
        <ul aria-busy="true" aria-label="Đang tải" className="divide-y divide-[#E2E8F0]">
          {[0, 1, 2].map((i) => (
            <li key={i} className="px-5 py-4">
              <div className="h-4 w-1/3 rounded bg-[#F1F5F9] animate-pulse" />
            </li>
          ))}
        </ul>
      ) : isEmpty ? (
        <EmptyState {...empty} className="!border-0 !shadow-none !rounded-none" />
      ) : (
        <ul className="divide-y divide-[#E2E8F0]">{children}</ul>
      )}
    </section>
  );
}

function OrgRow({ name, tag, tagWarn, count, onEdit, onDelete }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
      <div className="grow basis-full sm:basis-0 min-w-0 sm:min-w-[10rem] flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[16px] font-semibold text-[#0F172A] break-words">{name}</span>
        {tag && <Badge variant={tagWarn ? 'warning' : 'neutral'}>{tag}</Badge>}
      </div>

      <span
        className={`inline-flex items-center gap-1.5 text-[14px] tabular-nums ${count ? 'text-[#334155]' : 'text-[#64748B]'}`}
      >
        <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span><strong className="font-semibold">{count}</strong> nhân viên</span>
      </span>

      <div className="ml-auto flex items-center gap-1">
        <RowAction icon={Edit2} label="Sửa" ariaLabel={`Sửa ${name}`} onClick={onEdit} />
        <RowAction icon={Trash2} label="Xóa" ariaLabel={`Xóa ${name}`} onClick={onDelete} danger />
      </div>
    </li>
  );
}

function RowAction({ icon: Icon, label, ariaLabel, onClick, danger }) {
  const tone = danger
    ? 'hover:text-[#B91C1C] hover:bg-[#FEECEC]'
    : 'hover:text-[#008BC5] hover:bg-[#EAF6FF]';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`min-h-[44px] min-w-[44px] px-3 inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#475569] rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008BC5] ${tone}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}