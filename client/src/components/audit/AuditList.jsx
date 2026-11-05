import React from 'react';
import { AlertCircle, ScrollText } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { AuditRow } from './AuditRow.jsx';
import { AUDIT_GRID_COLS } from '../../constants/auditConfig.js';

const CARD = 'bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] overflow-hidden';

function Skeleton() {
  return (
    <div className={CARD} aria-busy="true" aria-label="Đang tải nhật ký">
      <ul className="divide-y divide-[#F1F5F9]">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="px-5 py-4 flex gap-4 animate-pulse">
            <div className="h-4 w-16 rounded bg-[#E2E8F0]" />
            <div className="h-4 w-40 rounded bg-[#E2E8F0]" />
            <div className="h-4 flex-1 rounded bg-[#F1F5F9]" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{ days: Array<{key:string,label:string,items:object[]}>, people: Map<string, object>,
 *   loading: boolean, error: string|null, onRetry: () => void, filtered: boolean, onClearFilters: () => void }} props
 */
export function AuditList({ days, people, loading, error, onRetry, filtered, onClearFilters }) {
  const hasItems = days.length > 0;

  if (error && !hasItems) {
    return (
      <div className={`${CARD} p-6 flex flex-col items-center text-center gap-3`}>
        <AlertCircle className="w-8 h-8 text-[#E53E3E]" />
        <p className="text-[16px] font-semibold text-[#0F172A]">Không tải được nhật ký</p>
        <p className="text-[16px] text-[#64748B]">{error}</p>
        <Button variant="secondary" onClick={onRetry}>Thử lại</Button>
      </div>
    );
  }

  if (loading && !hasItems) return <Skeleton />;

  if (!hasItems) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Không có nhật ký nào"
        description={filtered ? 'Không có thao tác nào khớp bộ lọc hiện tại. Thử mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc.' : 'Chưa có thao tác nào được ghi lại.'}
        actionText={filtered ? 'Xóa bộ lọc' : undefined}
        onAction={filtered ? onClearFilters : undefined}
      />
    );
  }

  return (
    <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {/* Tiêu đề cột: chỉ hiện trên màn hình rộng */}
      <div className={`hidden md:grid ${AUDIT_GRID_COLS} gap-4 px-5 text-[14px] font-bold uppercase tracking-wider text-[#64748B]`}>
        <span>Giờ</span>
        <span>Người thực hiện</span>
        <span>Thao tác</span>
        <span>Chi tiết</span>
      </div>

      {days.map((day) => (
        <section key={day.key} aria-label={day.label} className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-[16px] font-bold text-[#0F172A]">{day.label}</h2>
            <span className="text-[14px] text-[#64748B]">{day.items.length} thao tác</span>
          </div>
          <div className={CARD}>
            <ul className="divide-y divide-[#F1F5F9]">
              {day.items.map((log) => (
                <AuditRow key={log.id} log={log} person={log.actorCode ? people.get(String(log.actorCode).toUpperCase()) : undefined} />
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
