import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Button } from '../ui/Button.jsx';
import { ROLES, ROLE_LABELS } from '../../constants/roles.js';
import { Lock } from 'lucide-react';

const NEW = '__new__';
const selectCls =
  'w-full min-h-[48px] px-4 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]';

export function EmployeeFormModal({
  isOpen,
  onClose,
  initialData = null,
  blocks = [],
  departments = [],
  onSubmit,
  onAddBlock,
  onAddDepartment,
  currentStaffCode = '',
}) {
  const isEdit = !!initialData;
  const isSelf =
    isEdit &&
    currentStaffCode &&
    initialData?.code?.toUpperCase() === currentStaffCode.toUpperCase();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [departmentId, setDepartmentId] = useState('');
  const [blockId, setBlockId] = useState('');

  // Trường mật khẩu cho Quản trị / Quản lý
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Tạo nhanh Khối / Phòng ban ngay trong form: adding = 'block' | 'dept' | null
  const [adding, setAdding] = useState(null);
  const [newName, setNewName] = useState('');
  const [newDeptBlockId, setNewDeptBlockId] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const isStaffRole = role === ROLES.ADMIN || role === ROLES.MANAGER;

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code || '');
      setName(initialData.name || '');
      setRole(initialData.role || ROLES.EMPLOYEE);
      setDepartmentId(initialData.departmentId || '');
      setBlockId(initialData.blockId || '');
    } else {
      setCode('');
      setName('');
      setRole(ROLES.EMPLOYEE);
      setDepartmentId('');
      setBlockId('');
    }
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');
    setAdding(null);
    setNewName('');
    setAddError('');
  }, [initialData, isOpen]);

  // Khi chọn Phòng ban, tự động điền Khối mặc định nếu có
  const handleDepartmentChange = (deptId) => {
    setDepartmentId(deptId);
    if (deptId) {
      const dept = departments.find((d) => d.id === deptId);
      if (dept && dept.blockId) {
        setBlockId(dept.blockId);
      }
    }
  };

  const openAdd = (kind) => {
    setAdding(kind);
    setNewName('');
    setAddError('');
    setNewDeptBlockId(blockId || blocks[0]?.id || '');
  };

  const closeAdd = () => {
    setAdding(null);
    setNewName('');
    setAddError('');
  };

  const createInline = async () => {
    const n = newName.trim();
    const list = adding === 'block' ? blocks : departments;
    if (!n) return setAddError('Vui lòng nhập tên.');
    if (list.some((x) => x.name.trim().toLowerCase() === n.toLowerCase())) {
      return setAddError(`"${n}" đã tồn tại, hãy chọn trong danh sách.`);
    }
    if (adding === 'dept' && !newDeptBlockId) {
      return setAddError('Chưa có Khối nào. Hãy tạo Khối trước, rồi mới tạo Phòng ban.');
    }
    try {
      setAddLoading(true);
      if (adding === 'block') {
        const b = await onAddBlock({ name: n });
        setBlockId(b.id);
      } else {
        const d = await onAddDepartment({ name: n, blockId: newDeptBlockId });
        setDepartmentId(d.id);
        setBlockId(newDeptBlockId);
      }
      closeAdd();
    } catch (err) {
      setAddError(err.message || 'Lỗi khi tạo mới.');
    } finally {
      setAddLoading(false);
    }
  };

  const renderAddRow = () => {
    const isBlock = adding === 'block';
    return (
      <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="new-org-name" className="block text-[15px] font-semibold text-[#0F172A]">
            {isBlock ? 'Tên Khối mới' : 'Tên Phòng ban / Phân xưởng mới'}
          </label>
          <input
            id="new-org-name"
            autoFocus
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setAddError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createInline();
              }
            }}
            placeholder={isBlock ? 'Ví dụ: Khối kinh doanh' : 'Ví dụ: Phòng Kinh doanh'}
            disabled={addLoading}
            className={selectCls}
          />
        </div>

        {!isBlock && (
          <div className="space-y-1.5">
            <label htmlFor="new-dept-block" className="block text-[15px] font-semibold text-[#0F172A]">
              Thuộc Khối (mặc định)
            </label>
            <select
              id="new-dept-block"
              value={newDeptBlockId}
              onChange={(e) => setNewDeptBlockId(e.target.value)}
              disabled={addLoading}
              className={selectCls}
            >
              <option value="">-- Chọn khối --</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {addError && <p className="text-[14px] text-[#B91C1C] font-medium">{addError}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={closeAdd} disabled={addLoading}>
            Hủy
          </Button>
          <Button variant="primary" size="sm" onClick={createInline} loading={addLoading}>
            {isBlock ? 'Thêm Khối' : 'Thêm Phòng ban'}
          </Button>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedPass = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedCode) {
      setError('Vui lòng nhập mã nhân viên.');
      return;
    }
    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên nhân viên.');
      return;
    }

    // Với vai trò Nhân viên, bắt buộc chọn Phòng ban và Khối
    if (role === ROLES.EMPLOYEE) {
      if (!departmentId) {
        setError('Nhân viên bắt buộc phải chọn Phòng ban.');
        return;
      }
      if (!blockId) {
        setError('Nhân viên bắt buộc phải thuộc một Khối để xếp chỗ ngồi.');
        return;
      }
    }

    // Với vai trò Quản trị hoặc Quản lý: kiểm tra mật khẩu
    if (isStaffRole) {
      if (!isEdit) {
        // Tạo mới: bắt buộc nhập mật khẩu >= 8 ký tự
        if (!trimmedPass) {
          setPasswordError('Vui lòng nhập mật khẩu cho tài khoản quản trị.');
          return;
        }
        if (trimmedPass.length < 8) {
          setPasswordError('Mật khẩu phải có tối thiểu 8 ký tự.');
          return;
        }
        if (trimmedPass !== trimmedConfirm) {
          setConfirmPasswordError('Mật khẩu nhập lại không khớp.');
          return;
        }
      } else {
        // Chỉnh sửa: nếu có nhập thì phải >= 8 ký tự và khớp
        if (trimmedPass) {
          if (trimmedPass.length < 8) {
            setPasswordError('Mật khẩu phải có tối thiểu 8 ký tự.');
            return;
          }
          if (trimmedPass !== trimmedConfirm) {
            setConfirmPasswordError('Mật khẩu nhập lại không khớp.');
            return;
          }
        }
      }
    }

    try {
      setLoading(true);
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        role,
        departmentId: departmentId || null,
        blockId: blockId || null,
        password: isStaffRole && trimmedPass ? trimmedPass : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa thông tin nhân sự' : 'Thêm nhân sự mới'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FEECEC] border border-[#FECACA] rounded-lg text-[14px] text-[#B91C1C] font-medium">
            {error}
          </div>
        )}

        <Input
          label="Mã nhân viên"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ví dụ: NV101, QL02"
          disabled={isEdit || loading}
          required
          helperText={isEdit ? 'Mã nhân viên là định danh duy nhất, không thể sửa đổi.' : ''}
        />

        <Input
          label="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Nguyễn Văn An"
          disabled={loading}
          required
        />

        {/* Vai trò */}
        <div className="space-y-1.5">
          <label htmlFor="employee-role" className="block text-[16px] font-semibold text-[#0F172A]">
            Vai trò hệ thống <span className="text-[#E53E3E]">*</span>
          </label>
          <select
            id="employee-role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPassword('');
              setConfirmPassword('');
              setPasswordError('');
              setConfirmPasswordError('');
            }}
            disabled={isSelf || loading}
            className={`w-full min-h-[48px] px-4 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5] ${
              isSelf ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC]' : ''
            }`}
          >
            <option value={ROLES.EMPLOYEE}>{ROLE_LABELS[ROLES.EMPLOYEE]}</option>
            <option value={ROLES.MANAGER}>{ROLE_LABELS[ROLES.MANAGER]}</option>
            <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
          </select>
          {isSelf && (
            <p className="text-[13px] text-[#B45309] font-medium">
              Bạn không thể tự thay đổi vai trò tài khoản của chính mình.
            </p>
          )}
        </div>

        {/* Khối nhập Mật khẩu (chỉ hiện khi vai trò là Quản trị hoặc Quản lý) */}
        {isStaffRole && (
          <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
              <span className="text-[15px] font-bold text-[#0F172A] flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#008BC5]" />
                <span>Mật khẩu đăng nhập quản trị</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[13px] font-semibold text-[#008BC5] hover:text-[#0072A3] min-h-[44px] px-2 flex items-center cursor-pointer select-none"
              >
                {showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
            </div>

            {/* Ô 1: Mật khẩu */}
            <div className="space-y-1">
              <label
                htmlFor="staff-modal-password"
                className="block text-[15px] font-semibold text-[#0F172A]"
              >
                Mật khẩu {!isEdit && <span className="text-[#E53E3E]">*</span>}
              </label>
              <input
                id="staff-modal-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder={isEdit ? 'Để trống nếu không đổi' : 'Nhập mật khẩu (tối thiểu 8 ký tự)'}
                disabled={loading}
                className="w-full min-h-[48px] px-4 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              />
              {passwordError ? (
                <p className="text-[13px] text-[#E53E3E] font-medium">{passwordError}</p>
              ) : (
                <p className="text-[13px] text-[#64748B]">
                  {isEdit ? 'Để trống nếu không đổi.' : 'Tối thiểu 8 ký tự.'}
                </p>
              )}
            </div>

            {/* Ô 2: Nhập lại mật khẩu */}
            <div className="space-y-1">
              <label
                htmlFor="staff-modal-confirm-password"
                className="block text-[15px] font-semibold text-[#0F172A]"
              >
                Nhập lại mật khẩu {(!isEdit || password) && <span className="text-[#E53E3E]">*</span>}
              </label>
              <input
                id="staff-modal-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError('');
                }}
                placeholder="Xác nhận lại mật khẩu"
                disabled={loading}
                className="w-full min-h-[48px] px-4 py-2.5 text-[16px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
              />
              {confirmPasswordError && (
                <p className="text-[13px] text-[#E53E3E] font-medium">{confirmPasswordError}</p>
              )}
            </div>
          </div>
        )}

        {/* Phòng ban */}
        <div className="space-y-1.5">
          <label htmlFor="employee-dept" className="block text-[16px] font-semibold text-[#0F172A]">
            Phòng ban / Phân xưởng {role === ROLES.EMPLOYEE && <span className="text-[#E53E3E]">*</span>}
          </label>
          <select
            id="employee-dept"
            value={departmentId}
            onChange={(e) => (e.target.value === NEW ? openAdd('dept') : handleDepartmentChange(e.target.value))}
            disabled={loading}
            className={selectCls}
          >
            <option value="">-- {role === ROLES.EMPLOYEE ? 'Chọn phòng ban' : 'Không thuộc phòng ban (Tùy chọn)'} --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
            {onAddDepartment && <option value={NEW}>+ Thêm phòng ban / phân xưởng mới...</option>}
          </select>
          {adding === 'dept' && renderAddRow()}
        </div>

        {/* Khối */}
        <div className="space-y-1.5">
          <label htmlFor="employee-block" className="block text-[16px] font-semibold text-[#0F172A]">
            Khối trực thuộc {role === ROLES.EMPLOYEE && <span className="text-[#E53E3E]">*</span>}
          </label>
          <select
            id="employee-block"
            value={blockId}
            onChange={(e) => (e.target.value === NEW ? openAdd('block') : setBlockId(e.target.value))}
            disabled={loading}
            className={selectCls}
          >
            <option value="">-- {role === ROLES.EMPLOYEE ? 'Chọn khối trực thuộc' : 'Không thuộc khối (Tùy chọn)'} --</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            {onAddBlock && <option value={NEW}>+ Thêm khối mới...</option>}
          </select>
          {adding === 'block' && renderAddRow()}
          <p className="text-[13px] text-[#64748B]">
            Mặc định theo phòng ban, quản trị viên có thể đổi sang Khối khác độc lập.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            {isEdit ? 'Lưu thay đổi' : 'Thêm nhân sự'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}