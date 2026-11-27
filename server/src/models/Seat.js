import { getPool, sql } from '../config/db.js';

export const Seat = {
  async findAll({ includeToken = false } = {}) {
    const cols = includeToken ? 'seatId, groupId, employeeCode, token' : 'seatId, groupId, employeeCode';
    const res = await getPool().request().query(`SELECT ${cols} FROM Seats ORDER BY seatId ASC`);
    return res.recordset;
  },

  async findBySeatId(seatId, { includeToken = false } = {}) {
    const cols = includeToken ? 'seatId, groupId, employeeCode, token' : 'seatId, groupId, employeeCode';
    const res = await getPool()
      .request()
      .input('seatId', sql.NVarChar(50), seatId)
      .query(`SELECT ${cols} FROM Seats WHERE seatId = @seatId`);
    return res.recordset[0] || null;
  },

  async findByToken(token) {
    const res = await getPool()
      .request()
      .input('token', sql.NVarChar(255), token)
      .query('SELECT seatId, groupId, employeeCode, token FROM Seats WHERE token = @token');
    return res.recordset[0] || null;
  },

  async findByEmployeeCode(employeeCode) {
    const res = await getPool()
      .request()
      .input('employeeCode', sql.NVarChar(100), (employeeCode || '').trim().toUpperCase())
      .query('SELECT seatId, groupId, employeeCode FROM Seats WHERE employeeCode = @employeeCode');
    return res.recordset[0] || null;
  },

  async countByGroupId(groupId) {
    const res = await getPool()
      .request()
      .input('groupId', sql.NVarChar(100), groupId)
      .query('SELECT COUNT(*) AS cnt FROM Seats WHERE groupId = @groupId');
    return res.recordset[0].cnt;
  },

  async upsert(seatId, { groupId = null, employeeCode = null, token }) {
    const pool = getPool();
    const existing = await this.findBySeatId(seatId, { includeToken: true });
    if (existing) {
      const req = pool.request().input('seatId', sql.NVarChar(50), seatId);
      const sets = ['updatedAt = SYSUTCDATETIME()'];
      if (groupId !== undefined) {
        sets.push('groupId = @groupId');
        req.input('groupId', sql.NVarChar(100), groupId);
      }
      if (employeeCode !== undefined) {
        sets.push('employeeCode = @employeeCode');
        req.input('employeeCode', sql.NVarChar(100), employeeCode ? employeeCode.toUpperCase() : null);
      }
      if (token !== undefined) {
        sets.push('token = @token');
        req.input('token', sql.NVarChar(255), token);
      }
      const res = await req.query(
        `UPDATE Seats SET ${sets.join(', ')} OUTPUT INSERTED.seatId, INSERTED.groupId, INSERTED.employeeCode WHERE seatId = @seatId`
      );
      return res.recordset[0];
    }
    const res = await pool
      .request()
      .input('seatId', sql.NVarChar(50), seatId)
      .input('groupId', sql.NVarChar(100), groupId || null)
      .input('employeeCode', sql.NVarChar(100), employeeCode ? employeeCode.toUpperCase() : null)
      .input('token', sql.NVarChar(255), token || '')
      .query(
        `INSERT INTO Seats (seatId, groupId, employeeCode, token)
         OUTPUT INSERTED.seatId, INSERTED.groupId, INSERTED.employeeCode
         VALUES (@seatId, @groupId, @employeeCode, @token)`
      );
    return res.recordset[0];
  },

  async clearGroup(groupId) {
    await getPool()
      .request()
      .input('groupId', sql.NVarChar(100), groupId)
      .query('UPDATE Seats SET groupId = NULL, updatedAt = SYSUTCDATETIME() WHERE groupId = @groupId');
  },

  async clearEmployeeCode(employeeCode) {
    await getPool()
      .request()
      .input('employeeCode', sql.NVarChar(100), (employeeCode || '').trim().toUpperCase())
      .query('UPDATE Seats SET employeeCode = NULL, updatedAt = SYSUTCDATETIME() WHERE employeeCode = @employeeCode');
  },

  async updateManyGroup(seatIds, groupId) {
    if (!Array.isArray(seatIds) || seatIds.length === 0) return;
    const req = getPool().request().input('groupId', sql.NVarChar(100), groupId || null);
    const placeholders = seatIds.map((id, i) => {
      req.input(`s${i}`, sql.NVarChar(50), id);
      return `@s${i}`;
    });
    await req.query(`UPDATE Seats SET groupId = @groupId, updatedAt = SYSUTCDATETIME() WHERE seatId IN (${placeholders.join(',')})`);
  },

  async clearAllAssignments() {
    await getPool().request().query('UPDATE Seats SET groupId = NULL, employeeCode = NULL, updatedAt = SYSUTCDATETIME()');
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM Seats');
  },
};
