import React, { useEffect, useState } from 'react';

// Hướng dẫn 4 cảnh bằng SVG + CSS, tự chuyển cảnh mỗi 4s, bấm chấm để chọn cảnh.
const CAPTIONS = [
  'Quét mã QR ở cửa vào bằng camera điện thoại',
  'Nhập mã nhân viên ghi trên thẻ',
  'Xem chỗ ngồi, đi theo đường chấm trên bản đồ',
  'Ngồi vào ghế, quét mã QR ở lưng ghế phía trước để điểm danh',
];
const B = '#008BC5';

const qr = (x, y, s = 4) => [
  [1,1,1,0,1,1,1],[1,0,1,1,1,0,1],[1,1,1,0,1,1,1],
  [0,1,0,1,0,1,0],[1,1,1,0,1,0,1],[1,0,1,1,0,1,1],[1,1,1,0,1,1,1],
].flatMap((r, i) => r.map((v, j) => v ? <rect key={`${i}${j}`} x={x + j * s} y={y + i * s} width={s} height={s} fill="#0F172A" /> : null));

function Scene({ n }) {
  if (n === 0) return (
    <g>
      <rect x="62" y="80" width="76" height="76" rx="6" fill="#fff" stroke="#CBD5E1" />
      {qr(86, 98, 4)}
      <g fill="none" stroke={B} strokeWidth="3" strokeLinecap="round">
        <path d="M70 96v-8h8M130 96v-8h-8M70 140v8h8M130 140v8h-8" />
      </g>
      <rect className="gd-scan" x="70" y="96" width="60" height="3" rx="1.5" fill={B} />
      <text x="100" y="178" textAnchor="middle" fontSize="11" fill="#334155">Cửa vào</text>
    </g>
  );
  if (n === 1) return (
    <g>
      <text x="100" y="82" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0F172A">Mã nhân viên</text>
      <rect x="60" y="92" width="80" height="26" rx="6" fill="#fff" stroke={B} strokeWidth="2" />
      <clipPath id="gdc"><rect className="gd-type" x="66" y="94" width="60" height="22" /></clipPath>
      <text clipPath="url(#gdc)" x="66" y="110" fontSize="13" fontWeight="700" fill="#0F172A">NV001</text>
      <rect className="gd-caret" x="128" y="98" width="1.5" height="14" fill={B} />
      <rect className="gd-pop" x="60" y="130" width="80" height="26" rx="6" fill={B} />
      <text x="100" y="147" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">Xem chỗ ngồi</text>
    </g>
  );
  if (n === 2) return (
    <g>
      {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3, 4].map((c) => (
        <rect key={`${r}${c}`} x={68 + c * 14} y={84 + r * 14} width="9" height="9" rx="2" fill="#CBD5E1" />
      )))}
      <path className="gd-path" d="M100 168 V150 H110 V98 H124 V89" fill="none" stroke={B} strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />
      <rect className="gd-pulse" x="124" y="84" width="9" height="9" rx="2" fill="#F6AD37" />
      <text x="100" y="180" textAnchor="middle" fontSize="11" fill="#334155">Cửa vào</text>
    </g>
  );
  return (
    <g>
      <rect x="66" y="112" width="68" height="40" rx="8" fill="#EAF6FF" stroke={B} strokeWidth="2" />
      <text x="100" y="106" textAnchor="middle" fontSize="11" fill="#334155">Ghế của bạn</text>
      <rect x="86" y="122" width="28" height="28" rx="3" fill="#fff" stroke="#CBD5E1" />
      {qr(90, 126, 3)}
      <rect className="gd-scan2" x="88" y="124" width="24" height="2.5" rx="1.2" fill={B} />
      <g className="gd-pop2">
        <circle cx="134" cy="112" r="14" fill="#16A34A" />
        <path d="M127 112l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

export function GuideAnimation() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v + 1) % 4), 4000);
    return () => clearInterval(id);
  }, [n]); // đổi cảnh thủ công thì reset đồng hồ

  return (
    <div className="fade-in-up text-center">
      <svg viewBox="0 0 200 210" className="mx-auto w-[180px] h-auto" role="img" aria-label={CAPTIONS[n]}>
        <rect x="46" y="8" width="108" height="194" rx="16" fill="#0F172A" />
        <rect x="52" y="16" width="96" height="178" rx="10" fill="#F8FAFC" />
        <rect x="88" y="11" width="24" height="4" rx="2" fill="#334155" />
        <Scene key={n} n={n} />
      </svg>
      <p className="mt-2 min-h-[44px] px-2 text-[15px] font-medium text-[#0F172A]">
        <strong className="text-[#008BC5]">Bước {n + 1}/4:</strong> {CAPTIONS[n]}
      </p>
      <div className="flex justify-center">
        {CAPTIONS.map((_, i) => (
          <button key={i} type="button" onClick={() => setN(i)} aria-label={`Bước ${i + 1}`}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer">
            <span className={`h-2.5 rounded-full transition-all ${i === n ? 'w-6 bg-[#008BC5]' : 'w-2.5 bg-[#CBD5E1]'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}