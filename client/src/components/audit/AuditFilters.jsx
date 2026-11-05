import React from 'react';
import { Search } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Select } from '../ui/Select.jsx';
import { Input } from '../ui/Input.jsx';
import { AUDIT_CATEGORIES, AUDIT_TIME_RANGES } from '../../constants/auditConfig.js';

export function AuditFilters({ range, onRange, category, onCategory, actor, onActor }) {
  return (
    <Card className="space-y-4">
      <div>
        <p id="audit-range-label" className="text-[14px] font-semibold text-[#334155] mb-1.5">
          Khoảng thời gian
        </p>
        <div
          role="radiogroup"
          aria-labelledby="audit-range-label"
          className="grid grid-cols-4 gap-2 sm:inline-grid sm:grid-cols-[repeat(4,auto)]"
        >
          {AUDIT_TIME_RANGES.map((opt) => {
            const active = opt.value === range;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onRange(opt.value)}
                className={`min-h-[44px] px-2 sm:px-5 rounded-lg border text-[14px] sm:text-[16px] font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#008BC5] focus:ring-offset-2 ${
                  active
                    ? 'bg-[#008BC5] border-[#008BC5] text-white'
                    : 'bg-white border-[#E2E8F0] text-[#334155] hover:bg-[#F6F8FA]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Loại thao tác"
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          options={AUDIT_CATEGORIES}
          size="lg"
        />
        <div>
          <label htmlFor="audit-actor" className="block text-[14px] font-semibold text-[#334155] mb-1.5">
            Người thực hiện
          </label>
          <Input
            id="audit-actor"
            icon={Search}
            value={actor}
            onChange={(e) => onActor(e.target.value)}
            placeholder="Nhập mã, ví dụ ADMIN01"
            autoComplete="off"
            className="min-h-[50px] py-2.5"
          />
        </div>
      </div>
    </Card>
  );
}
