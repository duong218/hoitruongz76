import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { DEMO_MODE } from '../../constants/app.js';
import { seatBadgeText } from '../../utils/seatLabel.js';
import { Button } from '../ui/Button.jsx';
import { X, Camera, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export function ScannerModal({
  isOpen,
  onClose,
  onScanResult,
  userGroupSeats = [],
  allSeatGroups = {},
  seatTokens = {},
}) {
  const [cameraError, setCameraError] = useState('');
  const [showDemoSelector, setShowDemoSelector] = useState(true);
  const [selectedDemoSeat, setSelectedDemoSeat] = useState('');
  const scannerRef = useRef(null);
  const readerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) return;

    setCameraError('');
    let isRunning = false;

    // Khởi tạo camera
    const timer = setTimeout(() => {
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
  }, [isOpen]);

  // Set default demo seat
  useEffect(() => {
    if (userGroupSeats.length > 0) {
      setSelectedDemoSeat(userGroupSeats[0]);
    }
  }, [userGroupSeats]);

  const handleDecodedUrl = (text) => {
    try {
      let seat = '';
      let k = '';

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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/90 flex flex-col justify-between text-white p-4 pb-[env(safe-area-inset-bottom,20px)]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[17px] font-bold tracking-wide">Điểm danh tại chỗ</span>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[48px] min-h-[48px] flex items-center justify-center text-white/80 hover:text-white rounded-full bg-white/10 cursor-pointer"
          aria-label="Đóng máy quét"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main scanner view */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 space-y-4 max-w-md mx-auto w-full">
        <div className="text-center px-4">
          <p className="text-[20px] font-extrabold text-white leading-tight">
            Hướng camera vào mã QR dán trên ghế của bạn
          </p>
          <p className="text-[14px] text-white/70 mt-1">
            Mã QR được in và dán ngay phía trước thành tựa hoặc tay vịn của ghế.
          </p>
        </div>

        {/* Khung camera */}
        <div className="w-full aspect-square max-w-[320px] bg-black rounded-2xl border-2 border-white/30 overflow-hidden relative shadow-2xl flex items-center justify-center">
          <div id={readerId} className="w-full h-full" />

          {cameraError && (
            <div className="absolute inset-0 bg-[#0F172A]/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-[#F6AD37]" />
              <p className="text-[15px] font-medium text-white leading-snug">
                {cameraError}
              </p>
              <p className="text-[13px] text-white/70">
                Gợi ý: Quý vị cũng có thể mở camera điện thoại quét trực tiếp mã QR trên ghế để vào đường dẫn.
              </p>
            </div>
          )}
        </div>

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
                <span>Chế độ thử nghiệm (không cần camera)</span>
              </div>
              {showDemoSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoSelector && (
              <div className="space-y-2 pt-1 border-t border-white/10">
                <label htmlFor="demo-seat-select" className="block text-[13px] text-white/80">
                  Chọn ghế muốn thử quét:
                </label>
                <div className="flex gap-2">
                  <select
                    id="demo-seat-select"
                    value={selectedDemoSeat}
                    onChange={(e) => setSelectedDemoSeat(e.target.value)}
                    className="flex-1 min-h-[44px] px-3 py-1.5 text-[15px] bg-black/60 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#008BC5]"
                  >
                    <optgroup label="Ghế thuộc nhóm của bạn (Đúng)">
                      {userGroupSeats.map((sId) => (
                        <option key={sId} value={sId}>
                          {seatBadgeText(sId)} ({sId})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ghế thử sai (Nhóm khác)">
                      <option value="1-L-1">Hàng 1 - Trái - Ghế 1 (VIP)</option>
                      <option value="9-R-5">Hàng 9 - Phải - Ghế 5 (Khách mời)</option>
                    </optgroup>
                  </select>
                  <button
                    type="button"
                    onClick={handleSimulateScan}
                    className="px-4 py-2 min-h-[44px] bg-[#008BC5] hover:bg-[#0072A3] active:bg-[#005C85] text-white font-bold text-[14px] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Quét ghế này
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nút Hủy */}
      <div className="max-w-md mx-auto w-full">
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          onClick={onClose}
        >
          Hủy bỏ
        </Button>
      </div>
    </div>
  );
}
