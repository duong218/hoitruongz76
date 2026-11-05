import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { DEMO_MODE } from '../../constants/app.js';
import { seatBadgeText } from '../../utils/seatLabel.js';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { X, Camera, AlertTriangle, Sparkles, ChevronDown, ChevronUp, Keyboard, CheckCircle2 } from 'lucide-react';

export function ScannerModal({
  isOpen,
  onClose,
  onScanResult,
  userGroupSeats = [],
  allSeatGroups = {},
  seatTokens = {},
}) {
  const [cameraError, setCameraError] = useState('');
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const [selectedDemoSeat, setSelectedDemoSeat] = useState('');
  const scannerRef = useRef(null);
  const readerId = 'qr-reader-container';

  const [scanningLocked, setScanningLocked] = useState(false);

  // Chế độ nhập mã bằng tay khi hỏng camera hoặc không quét được
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScanningLocked(false);
      setManualMode(false);
      setManualCode('');
      setManualError('');
      return;
    }

    setCameraError('');
    let isRunning = false;

    // Khởi tạo camera nếu không ở manualMode
    const timer = setTimeout(() => {
      if (manualMode) return;
      try {
        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        scanner
          .start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              handleDecodedUrl(decodedText);
            },
            () => {
              // Đang tìm kiếm mã quét, không tính là lỗi
            }
          )
          .then(() => {
            isRunning = true;
          })
          .catch((err) => {
            setCameraError(
              'Không thể mở camera thiết bị (có thể do quyền truy cập bị chặn hoặc trình duyệt không cho phép).'
            );
          });
      } catch (err) {
        setCameraError('Trình duyệt không hỗ trợ quét camera qua trang này.');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } catch {
          // Bỏ qua lỗi dừng camera
        }
      }
    };
  }, [isOpen, manualMode]);

  // Đặt giá trị ghế mặc định từ danh sách ghế của nhóm cho demo
  useEffect(() => {
    if (userGroupSeats.length > 0) {
      setSelectedDemoSeat(userGroupSeats[0]);
    }
  }, [userGroupSeats]);

  const handleDecodedUrl = (text) => {
    if (scanningLocked) return;

    try {
      let seat = '';
      let k = '';

      // Trường hợp 1: Quét trúng QR dán cửa (/login) thay vì QR dán ghế
      if (text.includes('/login') || !text.includes('seat=')) {
        setScanningLocked(true);
        setTimeout(() => setScanningLocked(false), 2000);
        onScanResult({
          seat: '',
          token: '',
          error: 'Đây là mã QR ở Cửa (dành để mở web). Bạn hãy quét mã tem dán trên Ghế ngồi (có chữ Hàng... Ghế...).',
        });
        return;
      }

      if (text.includes('?')) {
        const queryString = text.split('?')[1];
        const params = new URLSearchParams(queryString);
        seat = params.get('seat') || '';
        k = params.get('k') || '';
      } else {
        // Dự phòng nếu mã QR chỉ chứa seat|token
        const parts = text.split('|');
        if (parts.length >= 2) {
          seat = parts[0];
          k = parts[1];
        }
      }

      if (seat) {
        setScanningLocked(true);
        setTimeout(() => setScanningLocked(false), 2500);
      }

      onScanResult({ seat, token: k });
    } catch {
      onScanResult({ seat: '', token: '' });
    }
  };

  const handleSimulateScan = () => {
    if (!selectedDemoSeat) return;
    const token = seatTokens[selectedDemoSeat] || 'ABC123';
    onScanResult({ seat: selectedDemoSeat, token });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
    const trimmedCode = manualCode.trim().toUpperCase();
    if (!trimmedCode) {
      setManualError('Vui lòng nhập 6 ký tự mã ghế in trên tem.');
      return;
    }
    if (trimmedCode.length < 6) {
      setManualError('Mã ghế gồm đúng 6 ký tự. Vui lòng nhập đủ 6 ký tự.');
      return;
    }
    try {
      setManualSubmitting(true);
      // Gửi trực tiếp token mã ghế, server tự tra cứu ghế tương ứng và kiểm tra vị trí
      await onScanResult({ seat: '', token: trimmedCode });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Mã ghế không đúng hoặc bạn ngồi không đúng vị trí.';
      setManualError(msg);
    } finally {
      setManualSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/95 flex flex-col justify-between text-white p-4 pb-[env(safe-area-inset-bottom,20px)] overflow-y-auto"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between pt-2 max-w-md mx-auto w-full">
        <span className="text-[17px] font-bold tracking-wide flex items-center gap-2">
          {manualMode ? <Keyboard className="w-5 h-5 text-[#38BDF8]" /> : <Camera className="w-5 h-5 text-[#38BDF8]" />}
          <span>{manualMode ? 'Nhập mã ghế thủ công' : 'Điểm danh tại chỗ'}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white/80 hover:text-white rounded-full bg-white/10 cursor-pointer"
          aria-label="Đóng máy quét"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 space-y-4 max-w-md mx-auto w-full">
        {!manualMode ? (
          /* ================= GIAO DIỆN QUÉT CAMERA ================= */
          <>
            <div className="text-center px-4">
              <p className="text-[19px] sm:text-[20px] font-extrabold text-white leading-tight">
                Hướng camera vào mã QR dán trên ghế của bạn
              </p>
              <p className="text-[13px] text-white/70 mt-1">
                Mã QR được in và dán ngay phía trước thành tựa hoặc tay vịn của ghế.
              </p>
            </div>

            {/* Khung camera */}
            <div className="w-full aspect-square max-w-[300px] bg-black rounded-2xl border-2 border-white/30 overflow-hidden relative shadow-2xl flex items-center justify-center">
              <div id={readerId} className="w-full h-full" />

              {cameraError && (
                <div className="absolute inset-0 bg-[#0F172A]/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-[#F6AD37]" />
                  <p className="text-[14px] font-medium text-white leading-snug">
                    {cameraError}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setManualMode(true)}
                    icon={Keyboard}
                  >
                    Chuyển sang nhập mã bằng tay
                  </Button>
                </div>
              )}
            </div>

            {/* NÚT LỚN: KHÔNG QUÉT ĐƯỢC? NHẬP MÃ GHẾ */}
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="w-full py-3.5 px-4 bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/30 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer"
            >
              <Keyboard className="w-5 h-5 text-[#38BDF8]" />
              <span>Không quét được? Nhập mã ghế</span>
            </button>
          </>
        ) : (
          /* ================= GIAO DIỆN NHẬP TAY (KHÔNG QUÉT ĐƯỢC) ================= */
          <form onSubmit={handleManualSubmit} className="w-full bg-[#1E293B] border border-white/20 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="text-center pb-2 border-b border-white/10 space-y-1">
              <h3 className="text-[20px] font-extrabold text-white">
                Nhập mã tem dán trên ghế
              </h3>
              <p className="text-[13px] text-white/70">
                Xem dòng chữ in <strong className="text-[#38BDF8]">"Mã: ......"</strong> ngay dưới mã QR trên ghế bạn đang ngồi.
              </p>
            </div>

            {manualError && (
              <div className="p-3 bg-[#EF4444]/20 border border-[#EF4444]/50 rounded-xl text-[14px] text-[#FCA5A5] font-semibold text-center">
                {manualError}
              </div>
            )}

            {/* Nhập mã 6 ký tự */}
            <div className="space-y-2 py-2">
              <label className="block text-[14px] font-bold text-white text-center">
                Mã bảo mật 6 ký tự:
              </label>
              <input
                type="text"
                maxLength={6}
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  setManualError('');
                }}
                placeholder="Ví dụ: K7M2QX"
                className="w-full text-center tracking-[6px] sm:tracking-[8px] font-mono text-[28px] sm:text-[32px] font-black uppercase py-3.5 px-4 bg-black/60 border-2 border-white/30 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/20 transition-all shadow-inner"
                autoFocus
              />
              <p className="text-[12px] text-white/50 text-center">
                (Bảng mã đã loại bỏ ký tự I, O, 0, 1 để tránh nhầm lẫn)
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[14px] rounded-xl transition-all cursor-pointer"
              >
                ← Quét camera
              </button>
              <button
                type="submit"
                disabled={!manualCode.trim() || manualSubmitting}
                className="flex-1 py-3.5 bg-[#008BC5] hover:bg-[#0072A3] active:bg-[#005C85] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-[15px] rounded-xl transition-all shadow-lg cursor-pointer"
              >
                {manualSubmitting ? 'Đang kiểm tra...' : 'Xác nhận điểm danh'}
              </button>
            </div>
          </form>
        )}

        {/* Chế độ thử (DEMO_MODE) */}
        {DEMO_MODE && (
          <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-white space-y-2">
            <button
              type="button"
              onClick={() => setShowDemoSelector(!showDemoSelector)}
              className="w-full flex items-center justify-between text-[14px] font-bold text-[#BAE6FD] min-h-[36px]"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F6AD37]" />
                <span>Chế độ thử nghiệm (Simulate)</span>
              </div>
              {showDemoSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoSelector && (
              <div className="space-y-2 pt-1 border-t border-white/10">
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                  <div className="flex-1">
                    <Select
                      label="Chọn ghế muốn thử quét:"
                      id="demo-seat-select"
                      value={selectedDemoSeat}
                      onChange={(e) => setSelectedDemoSeat(e.target.value)}
                      size="sm"
                      className="bg-black/80 border-white/30 text-white"
                    >
                      <optgroup label="Ghế thuộc nhóm của bạn (Đúng)" className="bg-[#0F172A] text-white">
                        {userGroupSeats.map((sId) => (
                          <option key={sId} value={sId}>
                            {seatBadgeText(sId)} ({sId})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Ghế thử sai (Nhóm khác)" className="bg-[#0F172A] text-white">
                        <option value="1-L-1">Hàng 1 - Trái - Ghế 1 (VIP)</option>
                        <option value="9-R-5">Hàng 9 - Phải - Ghế 5 (Khách mời)</option>
                      </optgroup>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    className="px-4 py-2 min-h-[40px] bg-[#008BC5] hover:bg-[#0072A3] active:bg-[#005C85] text-white font-bold text-[14px] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Quét ghế này
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nút Đóng */}
      <div className="max-w-md mx-auto w-full pt-2">
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={onClose}
        >
          Đóng
        </Button>
      </div>
    </div>
  );
}