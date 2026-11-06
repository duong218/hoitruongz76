import React, { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useEmployees } from '../../hooks/useEmployees.js';
import { useAuditLogs } from '../../hooks/useAuditLogs.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { AuditFilters } from '../../components/audit/AuditFilters.jsx';
import { AuditList } from '../../components/audit/AuditList.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { buildAuditParams, groupByDay, formatTime } from '../../utils/auditFormat.js';

const PAGE_SIZE = 50;

export function AuditPage() {
  const { employees } = useEmployees();
  const [range, setRange] = useState('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [page, setPage] = useState(1);
  const actor = useDebouncedValue(actorInput, 300);

  const params = useMemo(
    () => buildAuditParams({ range, fromDate, toDate, category, actor, page, limit: PAGE_SIZE }),
    [range, fromDate, toDate, category, actor, page]
  );
  const { items, total, pages, loading, error, updatedAt, refresh } = useAuditLogs(params);

  // Tra tên người thực hiện từ mã (server chỉ lưu mã)
  const people = useMemo(
    () => new Map(employees.map((e) => [String(e.code).toUpperCase(), e])),
    [employees]
  );
  const days = useMemo(() => groupByDay(items), [items]);

  // Đổi bộ lọc thì quay về trang 1
  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  // Bấm nút khoảng thời gian thì bỏ ngày đã chọn tay
  const pickRange = (value) => {
    setRange(value);
    setFromDate('');
    setToDate('');
    setPage(1);
  };
  const clearFilters = () => {
    setRange('all');
    setFromDate('');
    setToDate('');
    setCategory('');
    setActorInput('');
    setPage(1);
  };
  const goToPage = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = range !== 'all' || !!fromDate || !!toDate || !!category || !!actor.trim();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Nhật ký hoạt động
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Xem ai đã làm gì trong hệ thống. Nhật ký chỉ để xem, không thể sửa hoặc xóa.
        </p>
      </div>

      <AuditFilters
        range={range}
        onRange={pickRange}
        fromDate={fromDate}
        onFromDate={change(setFromDate)}
        toDate={toDate}
        onToDate={change(setToDate)}
        category={category}
        onCategory={change(setCategory)}
        actor={actorInput}
        onActor={change(setActorInput)}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[16px] text-[#334155]">
          <strong className="text-[#0F172A]">{total}</strong> thao tác
          {updatedAt && (
            <span className="hidden sm:inline text-[14px] text-[#64748B]"> · cập nhật lúc {formatTime(updatedAt)}</span>
          )}
        </p>
        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={refresh} disabled={loading}>
          Làm mới
        </Button>
      </div>

      <AuditList
        days={days}
        people={people}
        loading={loading}
        error={error}
        onRetry={refresh}
        filtered={filtered}
        onClearFilters={clearFilters}
      />

      <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onChange={goToPage} disabled={loading} />
    </div>
  );
}