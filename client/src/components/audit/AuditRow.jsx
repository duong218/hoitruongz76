import React from 'react';
import { Badge } from '../ui/Badge.jsx';
import { ROLE_LABELS } from '../../constants/roles.js';
import { AUDIT_GRID_COLS, getAuditAction, getAuditCategoryIcon } from '../../constants/auditConfig.js';
import { formatDateTime, formatTime } from '../../utils/auditFormat.js';

// Chỉ thao tác nguy hiểm / đáng chú ý mới có vạch màu bên trái để dễ lướt mắt
const TONE_BORDER = {
  error: 'border-l-[#E53E3E]',
  warning: 'border-l-[#F6AD37]',
};

function Actor({ log, person }) {
  if (log.action === 'auth.login_failed') {
    return (
      <div className="min-w-0">
        <p className="text-[16px] font-semibold text-[#0F172A] truncate">
          Mã thử: <span className="font-mono">{log.actorCode || '—'}</span>
        </p>
        <p className="text-[14px] text-[#64748B]">Chưa đăng nhập được</p>
      </div>
    );
  }
  if (!log.actorCode) {
    return <p className="text-[16px] text-[#64748B]">Không xác định</p>;
  }
  const role = ROLE_LABELS[log.actorRole];
  return (
    <div className="min-w-0">
      <p className="text-[16px] font-semibold text-[#0F172A] truncate">{person?.name || log.actorCode}</p>
      <p className="text-[14px] text-[#64748B] truncate">
        {person ? log.actorCode : `${log.actorCode} (tài khoản đã bị xóa)`}
        {role ? ` · ${role}` : ''}
      </p>
    </div>
  );
}

/**
 * Một dòng nhật ký. Mobile: xếp dọc (giờ + loại thao tác / người thực hiện / chi tiết).
 * Từ md trở lên: 1 hàng 4 cột. DOM giữ thứ tự desktop, mobile đổi thứ tự bằng `order`.
 */
export function AuditRow({ log, person }) {
  const action = getAuditAction(log.action);
  const Icon = getAuditCategoryIcon(log.action);

  return (
    <li
      className={`grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 md:gap-4 md:items-start px-4 md:px-5 py-3.5 border-l-[3px] border-l-transparent ${AUDIT_GRID_COLS} ${TONE_BORDER[action.tone] || ''}`}
    >
      <time
        dateTime={log.createdAt}
        title={formatDateTime(log.createdAt)}
        className="order-1 text-[14px] tabular-nums text-[#64748B] md:pt-0.5"
      >
        {formatTime(log.createdAt)}
      </time>

      <div className="order-3 col-span-2 md:order-2 md:col-span-1 min-w-0">
        <Actor log={log} person={person} />
      </div>

      <div className="order-2 justify-self-end md:order-3 md:justify-self-start">
        <Badge variant={action.tone} icon={Icon}>
          {action.label}
        </Badge>
      </div>

      <p className="order-4 col-span-2 md:order-4 md:col-span-1 text-[16px] text-[#334155] leading-normal break-words">
        {log.detail || <span className="text-[#94A3B8]">Không có chi tiết</span>}
      </p>
    </li>
  );
}
