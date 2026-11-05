import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEventSettings } from '../../hooks/useEventSettings.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Switch } from '../../components/ui/Switch.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TOTAL_ROWS, SEATS_PER_SIDE, seatId, isVipRow } from '../../constants/hall.js';
import { seatBadgeText } from '../../utils/seatLabel.js';
import {
  Settings,
  QrCode,
  Save,
  Download,
  Printer,
  AlertTriangle,
  Check,
  Armchair,
} from 'lucide-react';
import '../../utils/printQr.css';

export function ManagerEventPage() {
  const { event, updateEvent } = useEventSettings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('SETTINGS'); // 'SETTINGS' | 'QR'
  const [printTarget, setPrintTarget] = useState('NONE'); // 'LOGIN' | 'SEATS' | 'NONE'

  // Form cài đặt
  const [eventName, setEventName] = useState('');
  const [guestEnabled, setGuestEnabled] = useState(true);
  const [checkInOpen, setCheckInOpen] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Cấu hình QR
  const [appUrl, setAppUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const qrLoginRef = useRef(null);

  // Chọn hàng in tem dán ghế (mặc định chọn hàng 3-10, bỏ hàng 1-2 VIP)
  const [selectedPrintRows, setSelectedPrintRows] = useState([3, 4, 5, 6, 7, 8, 9, 10]);

  // Cấu hình kích cỡ tem dán ghế (M: 24 tem/A4, L: 12 tem/A4, XL: 6 tem/A4)
  const [stickerSize, setStickerSize] = useState('L'); // 'M' | 'L' | 'XL'

  useEffect(() => {
    if (event) {
      setEventName(event.eventName || '');
      setGuestEnabled(event.guestEnabled !== undefined ? event.guestEnabled : true);
      setCheckInOpen(event.checkInOpen !== undefined ? event.checkInOpen : true);
      const defaultUrl =
        event.appUrl ||
        (typeof window !== 'undefined' ? `${window.location.origin}/login` : '');
      setAppUrl(defaultUrl);
    }
  }, [event]);

  const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  // Lưu cài đặt sự kiện
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const trimmed = eventName.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập tên sự kiện / hội nghị.');
      return;
    }

    try {
      setSavingSettings(true);
      await updateEvent({
        eventName: trimmed,
        guestEnabled,
        checkInOpen,
      });
      toast.success('Đã lưu cấu hình sự kiện thành công.');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi lưu cấu hình.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Lưu URL ứng dụng
  const handleSaveUrl = async () => {
    try {
      setSavingUrl(true);
      await updateEvent({ appUrl });
      toast.success('Đã lưu địa chỉ đường dẫn ứng dụng.');
    } catch {
      toast.error('Lỗi khi lưu địa chỉ.');
    } finally {
      setSavingUrl(false);
    }
  };

  // Tải ảnh QR đăng nhập
  const handleDownloadLoginPng = () => {
    if (!qrLoginRef.current) return;
    const canvas = qrLoginRef.current.querySelector('canvas');
    if (!canvas) {
      toast.error('Không tìm thấy khung vẽ mã QR.');
      return;
    }
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ma_QR_DangNhap_${(event.eventName || 'Z176').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Đã tải ảnh mã QR PNG.');
  };

  // Lắng nghe sự kiện sau khi in để khôi phục giao diện
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintTarget('NONE');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // In QR đăng nhập dán cửa
  const handlePrintLogin = () => {
    setPrintTarget('LOGIN');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintTarget('NONE'), 3000);
    }, 200);
  };

  // In tem dán ghế
  const handlePrintSeatStickers = () => {
    if (selectedPrintRows.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hàng để in tem ghế.');
      return;
    }
    setPrintTarget('SEATS');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintTarget('NONE'), 3000);
    }, 200);
  };

  // Danh sách ghế cần in tem
  const seatStickersList = useMemo(() => {
    const list = [];
    const originUrl = appUrl ? appUrl.replace(/\/login\/?$/, '') : window.location.origin;

    selectedPrintRows.forEach((row) => {
      ['L', 'R'].forEach((side) => {
        for (let n = 1; n <= SEATS_PER_SIDE; n++) {
          const sId = seatId(row, side, n);
          const token = event?.seatTokens ? event.seatTokens[sId] : 'ABC123';
          const qrUrl = `${originUrl}/checkin?seat=${sId}&k=${token}`;
          list.push({
            seatId: sId,
            row,
            side,
            n,
            label: seatBadgeText(sId),
            qrUrl,
          });
        }
      });
    });

    return list;
  }, [selectedPrintRows, appUrl, event?.seatTokens]);

  const togglePrintRow = (row) => {
    setSelectedPrintRows((prev) =>
      prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row].sort((a, b) => a - b)
    );
  };

  const selectAllRows = () => {
    setSelectedPrintRows(Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1));
  };

  const deselectAllRows = () => {
    setSelectedPrintRows([]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="no-print">
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A] leading-tight">
          Cài đặt Sự kiện & Mã QR
        </h1>
        <p className="text-[16px] text-[#64748B] mt-1">
          Cấu hình phiên hội nghị, quản lý đóng/mở điểm danh và in các loại mã QR phục vụ đại biểu.
        </p>

        {/* 2 Tab phân đoạn */}
        <div className="flex border-b border-[#E2E8F0] gap-4 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-3 text-[16px] font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'SETTINGS'
                ? 'border-[#008BC5] text-[#008BC5]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Cài đặt chung</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            className={`pb-3 text-[16px] font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'QR'
                ? 'border-[#008BC5] text-[#008BC5]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>Mã QR Hội trường</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: CÀI ĐẶT ================= */}
      {activeTab === 'SETTINGS' && (
        <form
          onSubmit={handleSaveSettings}
          className="no-print bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-6 max-w-3xl"
        >
          {/* Tên sự kiện */}
          <Input
            label="Tên sự kiện / Hội nghị"
            id="event-title-input"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Ví dụ: Đại hội Đại biểu Z176 Nhiệm kỳ 2026 - 2031"
            required
            helperText="Tên sự kiện xuất hiện tại trang đăng nhập và tờ in mã QR."
          />

          {/* Công tắc Cho phép khách mời */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <label className="block text-[16px] font-bold text-[#0F172A]">
              Tiếp đón khách mời tham dự
            </label>
            <p className="text-[14px] text-[#64748B]">
              Bật nút "Tôi là khách mời" trên màn hình đăng nhập để tiếp đón đại biểu ngoài danh sách.
            </p>
            <div className="pt-1">
              <Switch
                checked={guestEnabled}
                onChange={(val) => setGuestEnabled(val)}
                label="Chức năng khách mời:"
              />
            </div>
          </div>

          {/* Công tắc lớn Mở điểm danh */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <label className="block text-[16px] font-bold text-[#0F172A]">
              Trạng thái mở cổng điểm danh tại ghế
            </label>
            <p className="text-[14px] text-[#64748B]">
              Khi bật, các đại biểu có thể bắt đầu quét mã QR trên ghế để xác nhận có mặt. Khi đóng, nút điểm danh sẽ bị khóa.
            </p>
            <div className="pt-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={checkInOpen}
                  onChange={(val) => setCheckInOpen(val)}
                  label="Cổng điểm danh:"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={savingSettings}
              icon={Save}
            >
              Lưu thay đổi cài đặt
            </Button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: MÃ QR ================= */}
      {activeTab === 'QR' && (
        <div className="no-print space-y-6">
          {/* Cảnh báo localhost nếu có */}
          {isLocalhost && (
            <div className="p-4 bg-[#FEF9EE] border-l-4 border-l-[#F6AD37] border-y border-r border-[#FDE68A] rounded-r-xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#F6AD37] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[16px] font-bold text-[#B45309]">Cảnh báo địa chỉ máy chủ cục bộ</h4>
                <p className="text-[15px] text-[#78350F] mt-0.5">
                  Địa chỉ này ({appUrl}) chỉ dùng được trên máy tính của bạn. Hãy nhập địa chỉ IP mạng nội bộ hoặc tên miền thực tế sau khi triển khai để camera điện thoại quét được.
                </p>
              </div>
            </div>
          )}

          {/* Cấu hình link QR */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-3">
            <h3 className="text-[18px] font-bold text-[#0F172A]">Đường dẫn gốc của ứng dụng</h3>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <Input
                  label="Địa chỉ ứng dụng (Link QR trỏ tới)"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleSaveUrl}
                loading={savingUrl}
                icon={Save}
              >
                Lưu địa chỉ
              </Button>
            </div>
          </div>

          {/* (1) KHỐI QR ĐĂNG NHẬP (DÁN CỬA) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-5">
            <div>
              <h3 className="text-[18px] font-bold text-[#0F172A]">1. Mã QR Đăng nhập dán tại Cửa hội trường</h3>
              <p className="text-[14px] text-[#64748B]">
                In khổ lớn A4 dán tại cửa ra vào để người tham dự quét bằng camera mở trang xem chỗ ngồi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div
                ref={qrLoginRef}
                className="p-4 bg-white border-2 border-[#CBD5E1] rounded-2xl flex items-center justify-center shrink-0"
              >
                <QRCodeCanvas
                  value={appUrl || 'https://z176.vn/login'}
                  size={200}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <h4 className="text-[16px] font-bold text-[#0F172A]">
                  Tờ in thông báo vào hội trường
                </h4>
                <p className="text-[14px] text-[#64748B]">
                  Mã tương phản cao (đen trên trắng, mức sửa lỗi M) tương thích với 100% camera điện thoại thông minh tiêu chuẩn.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Button variant="secondary" onClick={handleDownloadLoginPng} icon={Download}>
                    Tải ảnh PNG
                  </Button>
                  <Button variant="primary" onClick={handlePrintLogin} icon={Printer}>
                    In tờ dán cửa (A4)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* (2) KHỐI QR ĐIỂM DANH THEO GHẾ (DÁN TỪNG GHẾ) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(15,23,42,0.08)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-[18px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-[#008BC5]" />
                  <span>2. Mã QR Điểm danh dán lên từng ghế</span>
                </h3>
                <p className="text-[14px] text-[#64748B] mt-0.5">
                  Tùy chỉnh kích thước tem in sắc nét trên khổ A4 kèm đường nét đứt hỗ trợ cắt dán lên từng ghế hội trường.
                </p>
              </div>

              <Button variant="primary" onClick={handlePrintSeatStickers} icon={Printer}>
                In {seatStickersList.length} tem dán ghế
              </Button>
            </div>

            {/* Chọn kích thước tem in */}
            <div className="space-y-2 pb-3 border-b border-[#E2E8F0]">
              <label className="block text-[15px] font-bold text-[#0F172A]">
                Kích thước tem QR khi in:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setStickerSize('M')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    stickerSize === 'M'
                      ? 'border-[#008BC5] bg-[#EAF6FF] ring-2 ring-[#008BC5]'
                      : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#0F172A]">Tiêu chuẩn (24 tem/A4)</span>
                    {stickerSize === 'M' && <Check className="w-4 h-4 text-[#008BC5]" />}
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    Cỡ ~5 x 4.5 cm (Lưới 4 cột x 6 hàng). Tiết kiệm giấy in.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStickerSize('L')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    stickerSize === 'L'
                      ? 'border-[#008BC5] bg-[#EAF6FF] ring-2 ring-[#008BC5]'
                      : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#0F172A]">Cỡ Lớn - Rõ nét (12 tem/A4) ★</span>
                    {stickerSize === 'L' && <Check className="w-4 h-4 text-[#008BC5]" />}
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    Cỡ ~6.5 x 6 cm (Lưới 3 cột x 4 hàng). Mã QR to gấp đôi, quét cực nhạy.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStickerSize('XL')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    stickerSize === 'XL'
                      ? 'border-[#008BC5] bg-[#EAF6FF] ring-2 ring-[#008BC5]'
                      : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-[#0F172A]">Cực Đại (6 tem/A4)</span>
                    {stickerSize === 'XL' && <Check className="w-4 h-4 text-[#008BC5]" />}
                  </div>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    Cỡ ~9.5 x 8.5 cm (Lưới 2 cột x 3 hàng). Mã QR cực lớn, quét từ xa.
                  </p>
                </button>
              </div>
            </div>

            {/* Chọn hàng cần in */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-[#0F172A]">
                  Chọn các hàng ghế cần in tem:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllRows}
                    className="text-[13px] font-semibold text-[#008BC5] hover:underline cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-[#CBD5E1]">|</span>
                  <button
                    type="button"
                    onClick={deselectAllRows}
                    className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Hàng nút checkbox 1..10 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Array.from({ length: TOTAL_ROWS }, (_, i) => i + 1).map((r) => {
                  const isChecked = selectedPrintRows.includes(r);
                  const isVip = isVipRow(r);

                  return (
                    <label
                      key={r}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-colors min-h-[48px] ${
                        isChecked
                          ? 'border-[#008BC5] bg-[#EAF6FF] text-[#008BC5] font-bold'
                          : 'border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePrintRow(r)}
                        className="w-5 h-5 rounded border-[#CBD5E1] text-[#008BC5] focus:ring-[#008BC5] cursor-pointer"
                      />
                      <span className="text-[15px]">
                        Hàng {r} {isVip && <span className="text-[12px] text-[#B45309] font-semibold">(VIP)</span>}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[14px] text-[#334155] flex items-center justify-between">
                <span>
                  Đã chọn <strong>{selectedPrintRows.length}</strong> hàng • Tổng cộng: <strong>{seatStickersList.length}</strong> ghế
                </span>
                <span className="text-[#64748B]">
                  (Ước tính khoảng {Math.ceil(seatStickersList.length / (stickerSize === 'XL' ? 6 : stickerSize === 'L' ? 12 : 24))} trang A4)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= KHUNG IN DÁN CỬA (CHỈ HIỆN KHI PRINT LOGIN) ================= */}
      {printTarget === 'LOGIN' && (
        <div className="qr-print-sheet">
          <p className="qr-print-org">NHÀ MÁY Z176 - TỔNG CỤC CÔNG NGHIỆP QUỐC PHÒNG</p>
          <h1 className="qr-print-title">
            {event.eventName || 'HỘI NGHỊ TRIỂN KHAI NHIỆM VỤ'}
          </h1>

          <div className="qr-print-canvas-box">
            <QRCodeCanvas
              value={appUrl || `${window.location.origin}/login`}
              size={360}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#000000"
              includeMargin={true}
            />
          </div>

          <p className="qr-print-guide">
            Quét mã bằng camera điện thoại để xem chỗ ngồi
          </p>
          <p className="qr-print-url">{appUrl || `${window.location.origin}/login`}</p>
        </div>
      )}

      {/* ================= KHUNG IN TEM DÁN GHẾ (CHỈ HIỆN KHI PRINT SEATS) ================= */}
      {printTarget === 'SEATS' && (
        <div className={`qr-seat-stickers-sheet size-${stickerSize.toLowerCase()}`}>
          <div className="stickers-grid">
            {seatStickersList.map((item) => (
              <div key={item.seatId} className="sticker-card">
                <QRCodeCanvas
                  value={item.qrUrl}
                  size={stickerSize === 'XL' ? 180 : stickerSize === 'L' ? 130 : 85}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  includeMargin={false}
                />
                <span className="sticker-title">{item.label}</span>
                <span className="sticker-sub">Z176 • Điểm danh</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
