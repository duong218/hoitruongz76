// Chạy: npm run seed          (chỉ nạp khi database còn trống)
//       npm run seed:force    (XÓA dữ liệu cũ rồi nạp lại, cẩn thận)
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Block, Department, Employee, Group, Seat, EventSetting, Attendance } from '../models/index.js';
import { BLOCKS, DEPARTMENTS, GROUPS, EVENT, buildEmployees, buildSeats } from './seedData.js';

const FORCE = process.argv.includes('--force');
const MIN_PASSWORD_LENGTH = 8;

function requirePassword(name, value) {
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`${name} trong file .env phải có tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`);
  }
}

async function run() {
  requirePassword('SEED_ADMIN_PASSWORD', env.SEED_ADMIN_PASSWORD);
  requirePassword('SEED_MANAGER_PASSWORD', env.SEED_MANAGER_PASSWORD);

  await connectDB();

  const models = [Block, Department, Employee, Group, Seat, Attendance];
  const existingBlocks = await Block.findAll();
  const existingEmployees = await Employee.findAll();
  const existing = existingBlocks.length + existingEmployees.length;

  if (existing > 0 && !FORCE) {
    console.log('Database đã có dữ liệu, không nạp lại. Muốn xóa và nạp lại, chạy: npm run seed:force');
    return;
  }

  if (FORCE) {
    await Promise.all([...models, EventSetting].map((m) => m.deleteAll()));
    console.log('Đã xóa dữ liệu cũ.');
  }

  const [adminPasswordHash, managerPasswordHash] = await Promise.all([
    bcrypt.hash(env.SEED_ADMIN_PASSWORD, 10),
    bcrypt.hash(env.SEED_MANAGER_PASSWORD, 10),
  ]);

  const seats = buildSeats();
  for (const b of BLOCKS) await Block.create(b);
  for (const d of DEPARTMENTS) await Department.create(d);
  for (const g of GROUPS) await Group.create(g);
  for (const e of buildEmployees({ adminPasswordHash, managerPasswordHash })) await Employee.create(e);
  for (const s of seats) await Seat.upsert(s.seatId, s);
  await EventSetting.upsertMain(EVENT);

  console.log(
    `Đã nạp: ${BLOCKS.length} khối, ${DEPARTMENTS.length} phòng ban, ${GROUPS.length} nhóm, ` +
      `${buildEmployees({}).length} nhân sự, ${seats.length} ghế (${seats.filter((s) => s.groupId).length} ghế đã gán nhóm), 1 cấu hình sự kiện.`
  );
  console.log('Tài khoản quản trị: ADMIN01 và QL01 (mật khẩu lấy từ .env).');
}

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
