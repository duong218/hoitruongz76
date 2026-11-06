import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Lenis from 'lenis';
import './index.css';

// Cuộn mượt toàn hệ thống. Cảm ứng (điện thoại) giữ cuộn gốc; vùng cuộn lồng (bảng, modal) vẫn cuộn riêng.
// Người bật "giảm chuyển động" trong máy: thư viện tự tắt.
new Lenis({ autoRaf: true, allowNestedScroll: true, lerp: 0.1 });

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}