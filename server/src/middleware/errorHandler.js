// Trả lỗi theo dạng { message } để khớp với api.js ở client
// (api.js đọc error.response.data.message)

export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // JSON gửi lên bị hỏng hoặc quá lớn (body-parser cũng gắn status nên phải xét trước)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Dữ liệu gửi lên không đúng định dạng JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Dữ liệu gửi lên quá lớn.' });
  }
  // Lỗi do ứng dụng chủ động ném, có sẵn status
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  // Trùng giá trị unique (mã nhân viên, tên khối...)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'dữ liệu';
    return res.status(409).json({ message: `Giá trị của "${field}" đã tồn tại trên hệ thống.` });
  }
  // Dữ liệu không hợp lệ theo schema
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ message: first?.message || 'Dữ liệu không hợp lệ.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Máy chủ gặp lỗi. Vui lòng thử lại sau.' });
}
