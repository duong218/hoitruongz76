// Xuất Excel có định dạng (viền, màu, danh sách chọn). exceljs chỉ tải khi bấm nút.
// Đọc file nhập nhân viên vẫn dùng xlsx trong utils/excel.js.
const NAVY = 'FF1E3A8A';
const BORDER = { style: 'thin', color: { argb: 'FF000000' } };
const ALL_BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
const FILL = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const RED = 'FFFECACA'; // trùng ghế
const YELLOW = 'FFFEF08A'; // điểm danh hộ
const FONT = { name: 'Arial', size: 12 };

async function newWorkbook() {
  const { default: ExcelJS } = await import('exceljs');
  return new ExcelJS.Workbook();
}

async function save(wb, fileName) {
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function headerRow(ws, rowNumber) {
  const row = ws.getRow(rowNumber);
  row.height = 28;
  row.eachCell((c) => {
    c.font = { ...FONT, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = FILL(NAVY);
    c.border = ALL_BORDERS;
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function bodyRow(row, fillArgb) {
  row.eachCell({ includeEmpty: true }, (c) => {
    c.font = FONT;
    c.border = ALL_BORDERS;
    c.alignment = { vertical: 'middle', wrapText: true };
    if (fillArgb) c.fill = FILL(fillArgb);
  });
}

function printSetup(ws, titleRows) {
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: titleRows,
  };
}

function simpleSheet(wb, name, columns, rows, fillArgb) {
  const ws = wb.addWorksheet(name);
  ws.columns = columns;
  ws.addRow(columns.map((c) => c.header));
  headerRow(ws, 1);
  rows.forEach((r) => bodyRow(ws.addRow(r), fillArgb));
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  printSetup(ws, '1:1');
  return ws;
}

/**
 * @param {{ eventName: string, exportedBy: string, rows: Array<object>, summary: object }} p
 * row: { code, name, block, dept, group, seat, time, status, dupText, proxyText }
 */
export async function exportAttendanceXlsx({ eventName, exportedBy, rows, summary, filters = [] }) {
  const wb = await newWorkbook();
  const ws = wb.addWorksheet('Điểm danh');
  const widths = [12, 26, 20, 22, 20, 24, 12, 18, 75];
  ws.columns = widths.map((width) => ({ width }));
  const LAST = 'I';

  const info = [
    [eventName || 'Sự kiện'],
    [`Giờ xuất: ${new Date().toLocaleString('vi-VN')}   |   Người xuất: ${exportedBy || ''}`],
    [
      `Toàn đơn vị:  Cần điểm danh: ${summary.required}   |   Đã: ${summary.checked}   |   Chưa: ${summary.unchecked}` +
        `   |   Số ghế trùng: ${summary.dupSeats}   |   Điểm danh hộ: ${summary.proxy}`,
    ],
    [`Bộ lọc: ${filters.length ? filters.join('   |   ') : 'Không lọc (toàn bộ)'}   →   ${rows.length} dòng được xuất`],
    ['Chú giải màu:  nền ĐỎ = TRÙNG GHẾ   |   nền VÀNG = ĐIỂM DANH HỘ   (mỗi dòng đều có chữ ở cột Ghi chú)'],
  ];
  info.forEach((line, i) => {
    const r = ws.addRow(line);
    ws.mergeCells(`A${i + 1}:${LAST}${i + 1}`);
    r.getCell(1).font = { ...FONT, bold: i === 0, size: i === 0 ? 16 : 12 };
    r.height = i === 0 ? 28 : 20;
  });
  ws.addRow([]);

  const HEAD = 7;
  ws.addRow(['Mã NV', 'Họ và tên', 'Khối', 'Phòng ban', 'Nhóm ghế', 'Ghế ngồi', 'Giờ quét', 'Trạng thái', 'Ghi chú']);
  headerRow(ws, HEAD);

  rows.forEach((r) => {
    const note = [r.dupText, r.proxyText].filter(Boolean).join('\n');
    const row = ws.addRow([r.code, r.name, r.block, r.dept, r.group, r.seat, r.time, r.status, note]);
    bodyRow(row, r.dupText ? RED : r.proxyText ? YELLOW : null);
    row.height = 20 * Math.max(1, note.split('\n').length + (note.length > 70 ? 1 : 0));
    if (r.dupText && r.proxyText) row.getCell(9).fill = FILL(YELLOW);
  });

  ws.views = [{ state: 'frozen', ySplit: HEAD }];
  printSetup(ws, `${HEAD}:${HEAD}`);

  const dupRows = rows.filter((r) => r.dupText);
  const proxyRows = rows.filter((r) => r.proxyText);
  simpleSheet(
    wb,
    'Trùng ghế',
    [
      { header: 'Mã NV', width: 12 },
      { header: 'Họ và tên', width: 26 },
      { header: 'Ghế ngồi', width: 24 },
      { header: 'Giờ quét', width: 12 },
      { header: 'Ghi chú', width: 70 },
    ],
    // sắp theo ghế để những người cùng ghế nằm cạnh nhau
    [...dupRows].sort((a, b) => a.seat.localeCompare(b.seat)).map((r) => [r.code, r.name, r.seat, r.time, r.dupText]),
    RED
  );
  simpleSheet(
    wb,
    'Điểm danh hộ',
    [
      { header: 'Mã NV', width: 12 },
      { header: 'Họ và tên', width: 26 },
      { header: 'Giờ ghi nhận', width: 14 },
      { header: 'Người bấm hộ', width: 16 },
      { header: 'Lý do', width: 50 },
    ],
    proxyRows.map((r) => [r.code, r.name, r.time, r.proxyBy, r.proxyReason]),
    YELLOW
  );

  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  await save(wb, `diem-danh-${(eventName || 'Z176').replace(/\s+/g, '-')}${filters.length ? '-da-loc' : ''}-${ymd}.xlsx`);
}

/** Mẫu nhập nhân viên. Sheet đầu tiên là sheet được đọc khi nhập, tiêu đề ở dòng 1. */
export async function downloadEmployeeTemplate(blocks = [], departments = []) {
  const wb = await newWorkbook();

  const ws = wb.addWorksheet('Danh sách nhập');
  ws.columns = [{ width: 14 }, { width: 30 }, { width: 28 }, { width: 24 }, { width: 16 }];
  ws.addRow(['Mã NV', 'Họ và tên', 'Phòng ban', 'Khối', 'Vai trò']);
  headerRow(ws, 1);
  const ROWS = 60;
  for (let i = 0; i < ROWS; i++) bodyRow(ws.addRow(['', '', '', '', '']), i % 2 ? 'FFF1F5F9' : null);
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  printSetup(ws, '1:1');

  // Danh mục (nguồn cho danh sách chọn)
  const cat = wb.addWorksheet('Danh mục');
  cat.columns = [{ width: 32 }, { width: 32 }];
  cat.addRow(['Khối', 'Phòng ban']);
  headerRow(cat, 1);
  const n = Math.max(blocks.length, departments.length);
  for (let i = 0; i < n; i++) bodyRow(cat.addRow([blocks[i]?.name || '', departments[i]?.name || '']));

  const list = (col, count) => ({
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: 'Giá trị không hợp lệ',
    error: 'Hãy chọn từ danh sách.',
    formulae: [`'Danh mục'!$${col}$2:$${col}$${Math.max(count, 1) + 1}`],
  });
  for (let r = 2; r <= ROWS + 1; r++) {
    if (departments.length) ws.getCell(`C${r}`).dataValidation = list('B', departments.length);
    if (blocks.length) ws.getCell(`D${r}`).dataValidation = list('A', blocks.length);
    ws.getCell(`E${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Nhân viên"'], showErrorMessage: true, error: 'Chỉ chọn "Nhân viên".',
    };
  }

  // Hướng dẫn (chữ lớn, dễ đọc)
  const guide = wb.addWorksheet('Hướng dẫn');
  guide.columns = [{ width: 110 }];
  [
    ['CÁCH NHẬP DANH SÁCH NHÂN VIÊN', true],
    ['1. Điền vào sheet "Danh sách nhập", mỗi nhân viên một dòng, bắt đầu từ dòng 2. Không sửa dòng tiêu đề.', false],
    ['2. Mã NV và Họ và tên là bắt buộc. Mã NV không được trùng với mã đã có trong hệ thống.', false],
    ['3. Phòng ban và Khối: chọn từ danh sách xổ xuống. Bỏ trống Khối thì hệ thống lấy theo Phòng ban.', false],
    ['4. Vai trò: chọn "Nhân viên". Tài khoản Quản lý / Quản trị phải tạo bằng form trên hệ thống, không nhập bằng Excel.', false],
    ['Ví dụ một dòng đúng:   NV101  |  Nguyễn Văn Minh  |  (một phòng ban trong danh sách)  |  (một khối)  |  Nhân viên', false],
  ].forEach(([text, bold], i) => {
    const r = guide.addRow([text]);
    r.height = i === 0 ? 34 : 40;
    r.getCell(1).font = { name: 'Arial', size: i === 0 ? 18 : 14, bold };
    r.getCell(1).alignment = { vertical: 'middle', wrapText: true };
  });

  wb.views = [{ activeTab: 0 }];
  await save(wb, 'Mau_Danh_Sach_Nhan_Vien_Z176_v3.xlsx');
}