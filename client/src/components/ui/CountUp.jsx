import React, { useEffect, useRef, useState } from 'react';

// Số chạy dần lên giá trị mới (lần đầu từ 0, các lần sau từ số đang hiện). Tôn trọng "giảm chuyển động".
export function CountUp({ value, duration = 1400 }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const to = Number(value) || 0;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      from.current = to;
      setShown(to);
      return undefined;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const v = Math.round(start + (to - start) * (1 - Math.pow(1 - p, 3))); // easeOutCubic
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular-nums">{shown}</span>;
}