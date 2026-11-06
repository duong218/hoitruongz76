// Đo tải: N người cùng lúc đăng nhập -> mở trang chỗ ngồi (4 GET) -> (tuỳ chọn) điểm danh.
// Không cần cài gì thêm (Node 18+). Chạy:
//   node loadtest.mjs                          (200 người, server http://localhost:5000)
//   N=100 BASE=http://localhost:5000 CODES=NV001,NV002,NV004 node loadtest.mjs
//   CHECKIN=ABC234 node loadtest.mjs           (thêm bước điểm danh bằng mã 6 ký tự trên tem ghế)
// Lưu ý: mã dùng lặp lại nên điểm danh lần 2 trở đi sẽ trả 409, vẫn đo được thời gian.
const BASE = process.env.BASE || 'http://localhost:5000';
const N = Number(process.env.N) || 200;
const CODES = (process.env.CODES || 'NV001,NV002,NV003,NV004,NV005,NV006,NV007,NV008').split(',');
const CHECKIN = process.env.CHECKIN || '';

const stats = {}; // tên bước -> { ms: [], status: {} }
async function call(step, path, opts = {}) {
  const t = performance.now();
  let status = 'ERR';
  let body = null;
  try {
    const res = await fetch(BASE + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      signal: AbortSignal.timeout(10000), // giống timeout 10s của axios
    });
    status = res.status;
    body = await res.json().catch(() => null);
  } catch (e) {
    status = e.name === 'TimeoutError' ? 'TIMEOUT' : 'ERR';
  }
  const s = (stats[step] ??= { ms: [], status: {} });
  s.ms.push(performance.now() - t);
  s.status[status] = (s.status[status] || 0) + 1;
  return { status, body };
}

async function oneUser(i) {
  const code = CODES[i % CODES.length];
  const { status, body } = await call('1 đăng nhập', '/api/auth/attendee/lookup', {
    method: 'POST', body: JSON.stringify({ code }),
  });
  if (status !== 200 || !body?.token) return;
  const auth = { Authorization: `Bearer ${body.token}` };
  await Promise.all(['/api/seats', '/api/groups', '/api/event', '/api/attendance'].map((p) =>
    call('2 mở trang ' + p, p, { headers: auth })));
  if (CHECKIN) {
    await call('3 điểm danh', '/api/attendance/checkin', {
      method: 'POST', headers: auth, body: JSON.stringify({ token: CHECKIN }),
    });
    await call('4 tải lại điểm danh', '/api/attendance', { headers: auth });
  }
}

const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))];
const t0 = performance.now();
await Promise.all(Array.from({ length: N }, (_, i) => oneUser(i))); // tất cả bắn cùng lúc
console.log(`\n${N} người cùng lúc, tổng ${(performance.now() - t0).toFixed(0)} ms\n`);
for (const [step, s] of Object.entries(stats).sort()) {
  console.log(`${step.padEnd(32)} p50 ${q(s.ms, .5).toFixed(0)}ms  p95 ${q(s.ms, .95).toFixed(0)}ms  max ${Math.max(...s.ms).toFixed(0)}ms  ${JSON.stringify(s.status)}`);
}
