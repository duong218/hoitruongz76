import { getPool, sql } from '../config/db.js';
import { seatTaken, scheduleRebuild } from '../utils/seatEvents.js';

export const Attendance = {
  async findAll() {
    const res = await getPool()
      .request()
      .query('SELECT employeeCode, seatId, method, checkedInBy, reason, checkedInAt FROM Attendances ORDER BY checkedInAt DESC');
    return res.recordset;
  },

  async findByEmployeeCode(employeeCode) {
    const res = await getPool()
      .request()
      .input('employeeCode', sql.NVarChar(100), (employeeCode || '').trim().toUpperCase())
      .query('SELECT employeeCode, seatId, method, checkedInBy, reason, checkedInAt FROM Attendances WHERE employeeCode = @employeeCode');
    return res.recordset[0] || null;
  },

  async findBySeatId(seatId) {
    const res = await getPool()
      .request()
      .input('seatId', sql.NVarChar(50), seatId)
      .query('SELECT employeeCode, seatId, method, checkedInBy, reason, checkedInAt FROM Attendances WHERE seatId = @seatId');
    return res.recordset[0] || null;
  },

  async create({ employeeCode, seatId = '', method = 'SELF', checkedInBy = '', reason = '' }) {
    const res = await getPool()
      .request()
      .input('employeeCode', sql.NVarChar(100), (employeeCode || '').trim().toUpperCase())
      .input('seatId', sql.NVarChar(50), seatId || '')
      .input('method', sql.NVarChar(20), method)
      .input('checkedInBy', sql.NVarChar(100), checkedInBy || '')
      .input('reason', sql.NVarChar(500), (reason || '').trim())
      .query(
        `INSERT INTO Attendances (employeeCode, seatId, method, checkedInBy, reason)
         OUTPUT INSERTED.employeeCode, INSERTED.seatId, INSERTED.method, INSERTED.checkedInBy, INSERTED.reason, INSERTED.checkedInAt
         VALUES (@employeeCode, @seatId, @method, @checkedInBy, @reason)`
      );
    const created = res.recordset[0];
    seatTaken(created.seatId);
    return created;
  },

  async deleteByEmployeeCode(employeeCode) {
    const res = await getPool()
      .request()
      .input('employeeCode', sql.NVarChar(100), (employeeCode || '').trim().toUpperCase())
      .query('DELETE FROM Attendances OUTPUT DELETED.employeeCode WHERE employeeCode = @employeeCode');
    if (res.recordset.length > 0) scheduleRebuild();
    return res.recordset[0] || null;
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM Attendances');
    scheduleRebuild();
  },
};
