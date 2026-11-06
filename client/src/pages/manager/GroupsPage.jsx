import React, { useState } from 'react';
import { useGroups } from '../../hooks/useGroups.js';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useSeatAssignments } from '../../hooks/useSeatAssignments.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { GroupList } from '../../components/groups/GroupList.jsx';
import { GroupFormModal } from '../../components/groups/GroupFormModal.jsx';

export function GroupsPage() {
  const { groups, addGroup, updateGroup, deleteGroup, getGroupUsage } = useGroups();
  const { employees, refresh: refreshEmployees } = useEmployees();
  const { seatGroups, refresh: refreshSeats } = useSeatAssignments();
  const { blocks } = useOrg();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const handleAdd = () => {
    setEditingGroup(null);
    setModalOpen(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setModalOpen(true);
  };

  const handleDelete = async (group) => {
    const usage = await getGroupUsage(group.id);

    let confirmMessage = `Bạn có chắc chắn muốn xóa nhóm "${group.name}" không?`;
    if (usage.employeeCount > 0 || usage.seatCount > 0) {
      confirmMessage = `Nhóm "${group.name}" hiện có ${usage.employeeCount} nhân sự và ${usage.seatCount} ghế trong hội trường.\n\nXóa nhóm này sẽ bỏ gán tất cả các ghế đã sắp, đồng thời các thành viên thuộc nhóm sẽ chuyển về trạng thái Chưa phân nhóm. Bạn có chắc chắn muốn tiếp tục không?`;
    }

    const ok = await confirm({
      title: 'Xóa nhóm hội trường',
      message: confirmMessage,
      confirmText: 'Xóa nhóm',
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });

    if (ok) {
      try {
        await deleteGroup(group.id);
        await refreshEmployees();
        await refreshSeats();
        toast.success(`Đã xóa nhóm "${group.name}".`);
      } catch (err) {
        toast.error(err.message || 'Lỗi khi xóa nhóm.');
      }
    }
  };

  const handleFormSubmit = async (data) => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, data);
      toast.success(`Đã cập nhật nhóm "${data.name}".`);
    } else {
      await addGroup(data);
      toast.success(`Đã tạo nhóm mới "${data.name}".`);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Quản lý Nhóm ghế Hội trường
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Thiết lập nhóm chỗ ngồi, liên kết các Khối trực thuộc và cài đặt yêu cầu điểm danh tại chỗ.
        </p>
      </div>

      <GroupList
        groups={groups}
        employees={employees}
        blocks={blocks}
        seatGroups={seatGroups}
        onAddGroup={handleAdd}
        onEditGroup={handleEdit}
        onDeleteGroup={handleDelete}
      />

      <GroupFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingGroup}
        allGroups={groups}
        blocks={blocks}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
