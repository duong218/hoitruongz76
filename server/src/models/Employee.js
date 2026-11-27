import { getPool, sql } from '../config/db.js';
import { ROLES } from '../constants/roles.server.js';

const PUBLIC_COLS = 'code, name, role, departmentId, blockId';

export const Employee = {
  async findAll() {
    const res = await getPool().request().query(`SELECT ${PUBLIC_COLS} FROM Employees ORDER BY code ASC`);
    return res.recordset;
  },

  async findByCode(code, { includePasswordHash = false } = {}) {
    const cols = includePasswordHash ? `${PUBLIC_COLS}, passwordHash, passwordChangedAt` : PUBLIC_COLS;
    const res = await getPool()
      .request()
      .input('code', sql.NVarChar(100), (code || '').trim().toUpperCase())
      .query(`SELECT ${cols} FROM Employees WHERE code = @code`);
    return res.recordset[0] || null;
  },

  async create({ code, name, role = ROLES.EMPLOYEE, departmentId = null, blockId = null, passwordHash = null }) {
    const res = await getPool()
      .request()
      .input('code', sql.NVarChar(100), (code || '').trim().toUpperCase())
      .input('name', sql.NVarChar(255), (name || '').trim())
      .input('role', sql.NVarChar(50), role)
      .input('departmentId', sql.NVarChar(100), departmentId || null)
      .input('blockId', sql.NVarChar(100), blockId || null)
      .input('passwordHash', sql.NVarChar(255), passwordHash || null)
      .query(
        `INSERT INTO Employees (code, name, role, departmentId, blockId, passwordHash)
         OUTPUT INSERTED.code, INSERTED.name, INSERTED.role, INSERTED.departmentId, INSERTED.blockId
         VALUES (@code, @name, @role, @departmentId, @blockId, @passwordHash)`
      );
    return res.recordset[0];
  },

  async updateByCode(code, data) {
    const sets = ['updatedAt = SYSUTCDATETIME()'];
    const req = getPool().request().input('code', sql.NVarChar(100), (code || '').trim().toUpperCase());

    if (data.name !== undefined) {
      sets.push('name = @name');
      req.input('name', sql.NVarChar(255), (data.name || '').trim());
    }
    if (data.role !== undefined) {
      sets.push('role = @role');
      req.input('role', sql.NVarChar(50), data.role);
    }
    if (data.departmentId !== undefined) {
      sets.push('departmentId = @departmentId');
      req.input('departmentId', sql.NVarChar(100), data.departmentId || null);
    }
    if (data.blockId !== undefined) {
      sets.push('blockId = @blockId');
      req.input('blockId', sql.NVarChar(100), data.blockId || null);
    }
    if (data.passwordHash !== undefined) {
      sets.push('passwordHash = @passwordHash');
      req.input('passwordHash', sql.NVarChar(255), data.passwordHash || null);
    }
    if (data.passwordChangedAt !== undefined) {
      sets.push('passwordChangedAt = @passwordChangedAt');
      req.input('passwordChangedAt', sql.DateTime2, data.passwordChangedAt);
    }

    const res = await req.query(
      `UPDATE Employees SET ${sets.join(', ')} OUTPUT INSERTED.code, INSERTED.name, INSERTED.role, INSERTED.departmentId, INSERTED.blockId WHERE code = @code`
    );
    return res.recordset[0] || null;
  },

  async deleteByCode(code) {
    const res = await getPool()
      .request()
      .input('code', sql.NVarChar(100), (code || '').trim().toUpperCase())
      .query('DELETE FROM Employees OUTPUT DELETED.code WHERE code = @code');
    return res.recordset[0] || null;
  },

  async countByRole(role) {
    const res = await getPool()
      .request()
      .input('role', sql.NVarChar(50), role)
      .query('SELECT COUNT(*) AS cnt FROM Employees WHERE role = @role');
    return res.recordset[0].cnt;
  },

  async countByBlockIds(blockIds) {
    if (!Array.isArray(blockIds) || blockIds.length === 0) return 0;
    const req = getPool().request();
    const placeholders = blockIds.map((id, i) => {
      req.input(`b${i}`, sql.NVarChar(100), id);
      return `@b${i}`;
    });
    const res = await req.query(`SELECT COUNT(*) AS cnt FROM Employees WHERE blockId IN (${placeholders.join(',')})`);
    return res.recordset[0].cnt;
  },

  async countByDepartmentId(departmentId) {
    const res = await getPool()
      .request()
      .input('departmentId', sql.NVarChar(100), departmentId)
      .query('SELECT COUNT(*) AS cnt FROM Employees WHERE departmentId = @departmentId');
    return res.recordset[0].cnt;
  },

  async clearDepartment(departmentId) {
    await getPool()
      .request()
      .input('departmentId', sql.NVarChar(100), departmentId)
      .query('UPDATE Employees SET departmentId = NULL, updatedAt = SYSUTCDATETIME() WHERE departmentId = @departmentId');
  },

  async clearBlock(blockId) {
    await getPool()
      .request()
      .input('blockId', sql.NVarChar(100), blockId)
      .query('UPDATE Employees SET blockId = NULL, departmentId = NULL, updatedAt = SYSUTCDATETIME() WHERE blockId = @blockId');
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM Employees');
  },
};
