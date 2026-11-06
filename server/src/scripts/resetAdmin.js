import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { Employee } from '../models/index.js';
import { ROLES } from '../constants/roles.js';

/**
 * Script đặt lại mật khẩu Quản trị viên (ADMIN) trực tiếp từ Terminal
 * Cách dùng:
 *   node src/scripts/resetAdmin.js <mật_khẩu_mới>
 * Ví dụ:
 *   node src/scripts/resetAdmin.js Admin@123456
 */
async function run() {
  const newPassword = process.argv[2];

  if (!newPassword || newPassword.trim().length < 8) {
    console.error('\n❌ Lỗi: Vui lòng cung cấp mật khẩu mới có tối thiểu 8 ký tự!');
    console.log('👉 Cú pháp: node src/scripts/resetAdmin.js <mật_khẩu_mới>');
    console.log('👉 Hoặc:   npm run reset-admin <mật_khẩu_mới>\n');
    process.exit(1);
  }

  try {
    await connectDB();

    // Tìm tài khoản ADMIN (hoặc theo mã ADMIN hoặc vai trò ADMIN)
    let admin = await Employee.findOne({ role: ROLES.ADMIN });
    if (!admin) {
      admin = await Employee.findOne({ code: 'ADMIN' });
    }

    if (!admin) {
      console.error('\n❌ Không tìm thấy tài khoản Quản trị viên (ADMIN) trong cơ sở dữ liệu!');
      console.log('Vui lòng chạy lệnh nạp dữ liệu: npm run seed:force\n');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    admin.passwordHash = passwordHash;
    await admin.save();

    console.log('\n======================================================');
    console.log('✅ ĐẶT LẠI MẬT KHẨU ADMIN THÀNH CÔNG!');
    console.log(`👤 Tài khoản: ${admin.code} (${admin.name})`);
    console.log(`🔑 Mật khẩu mới: ${newPassword.trim()}`);
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Có lỗi xảy ra:', error.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

run();

