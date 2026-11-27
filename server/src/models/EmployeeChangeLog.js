import { getPool, sql } from '../config/db.js';

export const EmployeeChangeLog = {
  async findAll() {
    const res = await getPool().request().query(`
      SELECT id, employeeCode, oldName, newName, oldDept, newDept, oldBlock, newBlock, changedAt
      FROM EmployeeChangeLogs
      ORDER BY changedAt DESC, id DESC
    `);
    return res.recordset;
  },

  async create({ employeeCode, oldName = null, newName = null, oldDept = null, newDept = null, oldBlock = null, newBlock = null }) {
    await getPool()
      .request()
      .input('employeeCode', sql.NVarChar(50), employeeCode)
      .input('oldName', sql.NVarChar(200), oldName)
      .input('newName', sql.NVarChar(200), newName)
      .input('oldDept', sql.NVarChar(200), oldDept)
      .input('newDept', sql.NVarChar(200), newDept)
      .input('oldBlock', sql.NVarChar(200), oldBlock)
      .input('newBlock', sql.NVarChar(200), newBlock)
      .query(`
        INSERT INTO EmployeeChangeLogs (employeeCode, oldName, newName, oldDept, newDept, oldBlock, newBlock)
        VALUES (@employeeCode, @oldName, @newName, @oldDept, @newDept, @oldBlock, @newBlock)
      `);
  },

  async clearAll() {
    await getPool().request().query('DELETE FROM EmployeeChangeLogs');
  },
};
