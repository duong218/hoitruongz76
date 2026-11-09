// Chạy: node src/utils/eventWindow.check.js
import assert from 'node:assert/strict';
import { eventGate } from './eventWindow.js';

const ev = { opensAt: new Date('2026-11-20T12:00:00Z'), closesAt: new Date('2026-11-20T15:00:00Z') }; // 19:00-22:00 giờ VN
const at = (iso) => eventGate(ev, new Date(iso))?.code ?? 'OPEN';

assert.equal(at('2026-11-20T06:59:59Z'), 'EVENT_NOT_STARTED');   // 13:59 VN
assert.equal(at('2026-11-20T12:00:00Z'), 'OPEN');                // đúng 19:00 mở
assert.equal(at('2026-11-20T14:59:59Z'), 'OPEN');                // 21:59:59 còn mở
assert.equal(at('2026-11-20T15:00:00Z'), 'EVENT_ENDED');         // đúng 22:00 đóng
assert.equal(at('2026-11-21T01:00:00Z'), 'EVENT_ENDED');         // sáng hôm sau
assert.equal(eventGate(null).code, 'EVENT_NOT_SCHEDULED');       // chưa có sự kiện
assert.equal(eventGate({ opensAt: ev.opensAt, closesAt: null }).code, 'EVENT_NOT_SCHEDULED'); // thiếu một mốc
assert.match(eventGate(ev, new Date('2026-11-20T06:00:00Z')).message, /19:00 ngày 20\/11/); // in giờ Việt Nam
console.log('eventWindow: OK');