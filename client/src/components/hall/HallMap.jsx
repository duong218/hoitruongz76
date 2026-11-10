import React, { useMemo } from 'react';
import {
  TOTAL_ROWS,
  SEATS_PER_SIDE,
  VIP_ROWS,
  seatId,
  isVipRow,
  parseSeatId,
  MY_SEAT_COLOR,
  MY_SEAT_STROKE,
} from '../../constants/hall.js';
import {
  HALL_LAYOUT,
  getRowY,
  getSeatCoords,
  getSegmentHalo,
  getEntrancePathData,
} from './geometry.js';
import { Seat } from './Seat.jsx';
import { EntrancePath } from './EntrancePath.jsx';
import { YouAreHere } from './YouAreHere.jsx';

export function HallMap({
  mode = 'view', // 'view' | 'manage' | 'assign'
  seatGroups = {},
  groups = [],
  highlightGroupId = null,
  selectedRows = [],
  onToggleRow = () => {},
  occupiedSeats = null, // Set mã ghế đã có người điểm danh (chế độ view)
  mySeatId = '', // ghế của chính người xem: không làm mờ
  className = '',
  onSeatClick = null, // (seatId) => void: bấm vào ghế (dùng khi xếp chỗ từng người)
  selectedSeatId = '',
  seatTitles = null, // { [seatId]: 'chú thích khi rê chuột' }
}) {
  // Map nhóm theo id để tra cứu nhanh
  const groupMap = useMemo(() => {
    const map = new Map();
    groups.forEach((g) => map.set(g.id, g));
    return map;
  }, [groups]);

  // Nhóm đang được highlight (chế độ view)
  const highlightGroup = useMemo(() => {
    if (!highlightGroupId) return null;
    return groupMap.get(highlightGroupId) || null;
  }, [highlightGroupId, groupMap]);

  // Đã điểm danh có ghế: bỏ chỉ dẫn đường đi, chỉ đánh dấu "Bạn đã ngồi đây" tại ghế của mình
  const seatedAt = mode === 'view' && mySeatId ? parseSeatId(mySeatId) : null;
  const isSeated = !!seatedAt;

  // Phân tích các ghế được gán cho highlightGroup (chế độ view)
  const { highlightedRows, halos, nearestRowToEntrance, pathData } = useMemo(() => {
    if (mode !== 'view' || !highlightGroupId || isSeated) {
      return { highlightedRows: new Set(), halos: [], nearestRowToEntrance: null, pathData: [] };
    }

    const rowSideSeats = {}; // { [row]: { L: number[], R: number[] } }
    const rowsSet = new Set();

    Object.entries(seatGroups).forEach(([sId, gId]) => {
      if (gId === highlightGroupId) {
        const parts = sId.split('-');
        if (parts.length === 3) {
          const r = parseInt(parts[0], 10);
          const side = parts[1];
          const n = parseInt(parts[2], 10);
          rowsSet.add(r);
          if (!rowSideSeats[r]) rowSideSeats[r] = { L: [], R: [] };
          rowSideSeats[r][side].push(n);
        }
      }
    });

    const haloList = [];
    rowsSet.forEach((r) => {
      const sides = rowSideSeats[r];
      if (sides.L && sides.L.length > 0) {
        sides.L.sort((a, b) => a - b);
        const halo = getSegmentHalo(r, 'L', sides.L);
        if (halo) haloList.push({ ...halo, row: r, side: 'L' });
      }
      if (sides.R && sides.R.length > 0) {
        sides.R.sort((a, b) => a - b);
        const halo = getSegmentHalo(r, 'R', sides.R);
        if (halo) haloList.push({ ...halo, row: r, side: 'R' });
      }
    });

    // Đường nét đứt tới TỪNG cụm ghế của nhóm (cùng đi từ Cửa vào theo lối đi giữa)
    const nearest = rowsSet.size > 0 ? Math.max(...Array.from(rowsSet)) : null;
    const paths = haloList.flatMap((h) =>
      getEntrancePathData(
        h.row,
        h.side === 'L',
        h.side === 'R',
        h.side === 'L' ? h.midX : null,
        h.side === 'R' ? h.midX : null
      )
    );

    return {
      highlightedRows: rowsSet,
      halos: haloList,
      nearestRowToEntrance: nearest,
      pathData: paths,
    };
  }, [mode, highlightGroupId, seatGroups, isSeated]);

  // Tạo mảng 1..10 hàng
  const rows = Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1);

  return (
    <div className={`w-full overflow-hidden select-none bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-2 sm:p-4 ${className}`}>
      <svg
        viewBox={`0 0 ${HALL_LAYOUT.VIEW_WIDTH} ${HALL_LAYOUT.VIEW_HEIGHT}`}
        className="w-full h-auto block"
        aria-label="Sơ đồ 2D hội trường Z176"
      >
        <defs>
          {/* Symbol ghế hội trường */}
          <g id="hall-seat-symbol">
            {/* Lưng ghế */}
            <rect x="2" y="1" width="24" height="11" rx="3" />
            {/* Đệm ngồi */}
            <rect x="3" y="13" width="22" height="11" rx="3" />
            {/* Tay vịn trái & phải */}
            <rect x="0" y="6" width="3" height="16" rx="1.5" />
            <rect x="25" y="6" width="3" height="16" rx="1.5" />
          </g>

          {/* Mũi tên đầu đường nét đứt */}
          <marker
            id="path-arrow-head"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="18"
            markerHeight="18"
            orient="auto-start-reverse"
          >
            <path
              d="M 1 1 L 9 5 L 1 9 z"
              fill={highlightGroup?.color || '#008BC5'}
            />
          </marker>
        </defs>

        {/* Đường nét đứt đi qua khoảng trống TRƯỚC hàng ghế, mũi tên chỉ xuống (vẽ trước để chữ, ghế nằm trên) */}
        {mode === 'view' && pathData.length > 0 && (
          <EntrancePath
            pathData={pathData}
            color={highlightGroup?.color || '#008BC5'}
          />
        )}


        {/* Nền sân khấu */}
        <g className="stage-area">
          <rect
            x={HALL_LAYOUT.STAGE.x}
            y={HALL_LAYOUT.STAGE.y}
            width={HALL_LAYOUT.STAGE.width}
            height={HALL_LAYOUT.STAGE.height}
            rx="8"
            fill="#0F172A"
          />
          <text
            x={HALL_LAYOUT.STAGE.x + HALL_LAYOUT.STAGE.width / 2}
            y={HALL_LAYOUT.STAGE.y + HALL_LAYOUT.STAGE.height / 2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            fontSize="18"
            fontWeight="700"
            letterSpacing="2"
          >
            SÂN KHẤU
          </text>
        </g>

        {/* Lối đi giữa nhãn hướng dẫn kèm quy ước đếm số ghế */}
        <text
          x={HALL_LAYOUT.ENTRANCE.centerX}
          y={HALL_LAYOUT.STAGE.y + HALL_LAYOUT.STAGE.height + 17}
          textAnchor="middle"
          fill="#475569"
          fontSize="12"
          fontWeight="700"
          letterSpacing="1"
          stroke="#FFFFFF"
          strokeWidth="4"
          paintOrder="stroke"
        >
          LỐI ĐI GIỮA
        </text>
        <text
          x={HALL_LAYOUT.ENTRANCE.centerX}
          y={HALL_LAYOUT.STAGE.y + HALL_LAYOUT.STAGE.height + 30}
          textAnchor="middle"
          fill="#008BC5"
          fontSize="10.5"
          fontWeight="700"
          stroke="#FFFFFF"
          strokeWidth="4"
          paintOrder="stroke"
        >
          (Ghế 1 sát lối đi ↔ Ghế 10 sát tường)
        </text>

        {/* Thanh thước kẻ số ghế phía trên Hàng 1 (Header cột ghế) */}
        <g className="column-headers" opacity="0.85" stroke="#FFFFFF" strokeWidth="3" paintOrder="stroke">
          {/* Bên Trái: Ghế 10 ngoài cùng -> Ghế 1 sát lối đi */}
          {Array.from({ length: SEATS_PER_SIDE }, (_, i) => 10 - i).map((n) => {
            const coords = getSeatCoords(1, 'L', n);
            return (
              <text
                key={`header-L-${n}`}
                x={coords.x + 14}
                y={HALL_LAYOUT.ROW_START_Y - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#64748B"
              >
                {n}
              </text>
            );
          })}
          {/* Bên Phải: Ghế 1 sát lối đi -> Ghế 10 ngoài cùng */}
          {Array.from({ length: SEATS_PER_SIDE }, (_, i) => i + 1).map((n) => {
            const coords = getSeatCoords(1, 'R', n);
            return (
              <text
                key={`header-R-${n}`}
                x={coords.x + 14}
                y={HALL_LAYOUT.ROW_START_Y - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#64748B"
              >
                {n}
              </text>
            );
          })}
        </g>

        {/* Vẽ từng hàng ghế */}
        {rows.map((row) => {
          const y = getRowY(row);
          const isVip = isVipRow(row);
          const isSelected = selectedRows.includes(row);
          const isHighlightedRow = highlightedRows.has(row);

          return (
            <g key={`row-${row}`} className="hall-row">
              {/* Vùng chọn hàng trong chế độ ASSIGN */}
              {mode === 'assign' && (
                <rect
                  x="8"
                  y={y - 7}
                  width={HALL_LAYOUT.VIEW_WIDTH - 16}
                  height={HALL_LAYOUT.ROW_HEIGHT + 14}
                  rx="8"
                  fill={isSelected ? '#EAF6FF' : 'transparent'}
                  stroke={isSelected ? '#008BC5' : 'transparent'}
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-[#F1F5F9]/70 transition-colors"
                  onClick={() => onToggleRow(row)}
                />
              )}

              {/* Nhãn hàng bên Trái */}
              <g
                className={mode === 'assign' ? 'cursor-pointer' : ''}
                onClick={mode === 'assign' ? () => onToggleRow(row) : undefined}
              >
                {/* Badge cho hàng được chỉ định trong chế độ VIEW */}
                {mode === 'view' && isHighlightedRow ? (
                  <rect
                    x="10"
                    y={y + 1}
                    width="85"
                    height="28"
                    rx="6"
                    fill={highlightGroup?.color || '#008BC5'}
                  />
                ) : null}
                <text
                  x="52"
                  y={y + 15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="15"
                  fontWeight={isHighlightedRow || isSelected ? '700' : '600'}
                  fill={
                    mode === 'view' && isHighlightedRow
                      ? '#FFFFFF'
                      : isSelected
                      ? '#008BC5'
                      : isVip
                      ? '#B45309'
                      : '#334155'
                  }
                >
                  {`Hàng ${row}${isVip ? ' VIP' : ''}`}
                </text>
              </g>

              {/* Ghế bên Trái: Ghế 10 (ngoài cùng) đến Ghế 1 (sát lối đi) */}
              {Array.from({ length: SEATS_PER_SIDE }, (_, i) => 10 - i).map((n) => {
                const sId = seatId(row, 'L', n);
                const coords = getSeatCoords(row, 'L', n);
                const gId = seatGroups[sId];

                let fill = '#E2E8F0';
                let stroke = '#CBD5E1';
                let isSeatHighlighted = false;

                if (mode === 'view') {
                  if (gId === highlightGroupId) {
                    fill = highlightGroup?.color || '#008BC5';
                    stroke = highlightGroup?.color || '#008BC5';
                    isSeatHighlighted = true;
                  }
                  // Ghế khác TUYỆT ĐỐI giữ nguyên xám
                } else {
                  // Chế độ manage và assign: tô theo màu nhóm
                  if (gId && groupMap.has(gId)) {
                    fill = groupMap.get(gId).color;
                    stroke = groupMap.get(gId).color;
                  }
                }

                return (
                  <Seat
                    key={sId}
                    x={coords.x}
                    y={coords.y}
                    seatNumber={n}
                    fill={mode === 'view' && sId === mySeatId ? MY_SEAT_COLOR : fill}
                    stroke={mode === 'view' && sId === mySeatId ? MY_SEAT_STROKE : stroke}
                    dim={mode === 'view' && gId === highlightGroupId && !!occupiedSeats?.has(sId) && sId !== mySeatId}
                    onClick={onSeatClick ? () => onSeatClick(sId) : undefined}
                    title={seatTitles?.[sId]}
                  />
                );
              })}

              {/* Ghế bên Phải: Ghế 1 (sát lối đi) đến Ghế 10 (ngoài cùng) */}
              {Array.from({ length: SEATS_PER_SIDE }, (_, i) => i + 1).map((n) => {
                const sId = seatId(row, 'R', n);
                const coords = getSeatCoords(row, 'R', n);
                const gId = seatGroups[sId];

                let fill = '#E2E8F0';
                let stroke = '#CBD5E1';

                if (mode === 'view') {
                  if (gId === highlightGroupId) {
                    fill = highlightGroup?.color || '#008BC5';
                    stroke = highlightGroup?.color || '#008BC5';
                  }
                  // Ghế khác TUYỆT ĐỐI giữ nguyên xám
                } else {
                  if (gId && groupMap.has(gId)) {
                    fill = groupMap.get(gId).color;
                    stroke = groupMap.get(gId).color;
                  }
                }

                return (
                  <Seat
                    key={sId}
                    x={coords.x}
                    y={coords.y}
                    seatNumber={n}
                    fill={mode === 'view' && sId === mySeatId ? MY_SEAT_COLOR : fill}
                    stroke={mode === 'view' && sId === mySeatId ? MY_SEAT_STROKE : stroke}
                    dim={mode === 'view' && gId === highlightGroupId && !!occupiedSeats?.has(sId) && sId !== mySeatId}
                    onClick={onSeatClick ? () => onSeatClick(sId) : undefined}
                    title={seatTitles?.[sId]}
                  />
                );
              })}

              {/* Nhãn hàng bên Phải */}
              <g
                className={mode === 'assign' ? 'cursor-pointer' : ''}
                onClick={mode === 'assign' ? () => onToggleRow(row) : undefined}
              >
                {mode === 'view' && isHighlightedRow ? (
                  <rect
                    x="845"
                    y={y + 1}
                    width="85"
                    height="28"
                    rx="6"
                    fill={highlightGroup?.color || '#008BC5'}
                  />
                ) : null}
                <text
                  x="887"
                  y={y + 15}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="15"
                  fontWeight={isHighlightedRow || isSelected ? '700' : '600'}
                  fill={
                    mode === 'view' && isHighlightedRow
                      ? '#FFFFFF'
                      : isSelected
                      ? '#008BC5'
                      : isVip
                      ? '#B45309'
                      : '#334155'
                  }
                >
                  {`Hàng ${row}${isVip ? ' VIP' : ''}`}
                </text>
              </g>
            </g>
          );
        })}

        {/* Ghế đang được chọn để gán */}
        {selectedSeatId && (() => {
          const p = parseSeatId(selectedSeatId);
          if (!p) return null;
          const c = getSeatCoords(p.row, p.side, p.n);
          return <rect x={c.x - 3} y={c.y - 3} width={c.width + 6} height={c.height + 6} rx="6" fill="none" stroke="#0F172A" strokeWidth="2.5" pointerEvents="none" />;
        })()}

        {/* Khung Halo nhấp nháy bao quanh các đoạn ghế được chỉ định trong chế độ VIEW */}
        {mode === 'view' && halos.map((halo, idx) => (
          <rect
            key={`halo-${idx}`}
            x={halo.x}
            y={halo.y}
            width={halo.width}
            height={halo.height}
            rx="6"
            fill="none"
            stroke={highlightGroup?.color || '#008BC5'}
            strokeWidth="3"
            className="hall-halo-pulse"
          />
        ))}

        {/* Ghế của chính người xem sau khi điểm danh */}
        {seatedAt && <YouAreHere row={seatedAt.row} side={seatedAt.side} n={seatedAt.n} />}

        {/* Khu vực CỬA VÀO dưới cùng giữa */}
        <g className="entrance-area">
          <rect
            x={HALL_LAYOUT.ENTRANCE.x}
            y={HALL_LAYOUT.ENTRANCE.y}
            width={HALL_LAYOUT.ENTRANCE.width}
            height={HALL_LAYOUT.ENTRANCE.height}
            rx="8"
            fill="#334155"
          />
          <text
            x={HALL_LAYOUT.ENTRANCE.x + HALL_LAYOUT.ENTRANCE.width / 2}
            y={HALL_LAYOUT.ENTRANCE.y + HALL_LAYOUT.ENTRANCE.height / 2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            fontSize="16"
            fontWeight="700"
          >
            CỬA VÀO ↑
          </text>
        </g>
      </svg>
    </div>
  );
}