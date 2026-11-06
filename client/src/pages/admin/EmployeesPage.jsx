import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useOrg } from '../../hooks/useOrg.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { EmployeeTable } from '../../components/employees/EmployeeTable.jsx';
import { EmployeeFormModal } from '../../components/employees/EmployeeFormModal.jsx';
import { ImportExcelModal } from '../../components/employees/ImportExcelModal.jsx';

export function EmployeesPage() {
  const { staff } = useAuth();
  const { employees, addEmployee, updateEmployee, deleteEmployee, deleteEmployees, importEmployees } = useEmployees();
  const { blocks, departments, addBlock, addDepartment } = useOrg();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleAddNew = () => {
    setEditingEmployee(null);
    setFormModalOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormModalOpen(true);
  };

  const handleDelete = async (employee) => {
    const ok = await confirm({
      title: 'Xóa nhân sự',
      message: `Bạn có chắc chắn muốn xóa nhân sự "${employee.name}" (${employee.code}) khỏi hệ thống?`,
      confirmText: 'Xóa nhân sự',
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });

    if (ok) {
      try {
        await deleteEmployee(employee.code);
        toast.success(`Đã xóa nhân sự ${employee.name}.`);
      } catch (err) {
        toast.error(err.message || 'Lỗi khi xóa nhân sự.');
      }
    }
  };

  // Xóa nhiều người (đã chọn hoặc tất cả đang hiển thị). Trả về true nếu đã xóa.
  const handleDeleteMany = async (list, isAll) => {
    const ok = await confirm({
      title: isAll ? 'Xóa tất cả nhân sự' : 'Xóa nhân sự đã chọn',
      message: `Bạn sắp xóa ${list.length} nhân sự${isAll ? ' đang hiển thị trong danh sách' : ' đã chọn'}. Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục không?`,
      confirmText: `Xóa ${list.length} người`,
      cancelText: 'Hủy bỏ',
      isDanger: true,
    });
    if (!ok) return false;
    try {
      const failed = await deleteEmployees(list.map((e) => e.code));
      if (failed) toast.error(`Đã xóa ${list.length - failed} người, ${failed} người xóa lỗi.`);
      else toast.success(`Đã xóa ${list.length} nhân sự.`);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi xóa nhân sự.');
    }
    return true;
  };

  const handleFormSubmit = async (data) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.code, data);
      toast.success(`Đã cập nhật thông tin nhân sự ${data.name}.`);
    } else {
      await addEmployee(data);
      toast.success(`Đã thêm mới nhân sự ${data.name} (${data.code}).`);
    }
  };

  const handleAddBlock = async (data) => {
    const b = await addBlock(data);
    toast.success(`Đã thêm Khối "${b.name}".`);
    return b;
  };

  const handleAddDepartment = async (data) => {
    const d = await addDepartment(data);
    toast.success(`Đã thêm Phòng ban "${d.name}".`);
    return d;
  };

  const handleImportValid = async (validRows) => {
    const result = await importEmployees(validRows);
    toast.success(`Đã nhập thành công ${result.importedCount} nhân sự từ file Excel.`);
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Quản lý Nhân sự
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Quản lý danh sách nhân sự tham dự, phân công Phòng ban, Khối trực thuộc và phân quyền hệ thống.
        </p>
      </div>

      <EmployeeTable
        employees={employees}
        blocks={blocks}
        departments={departments}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteMany={handleDeleteMany}
        onOpenImport={() => setImportModalOpen(true)}
        currentStaffCode={staff?.code || ''}
      />

      <EmployeeFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        initialData={editingEmployee}
        blocks={blocks}
        departments={departments}
        onAddBlock={handleAddBlock}
        onAddDepartment={handleAddDepartment}
        onSubmit={handleFormSubmit}
        currentStaffCode={staff?.code || ''}
      />

      <ImportExcelModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        existingEmployees={employees}
        blocks={blocks}
        departments={departments}
        onImportValid={handleImportValid}
        onAddBlock={handleAddBlock}
        onAddDepartment={handleAddDepartment}
      />
    </div>
  );
}