import { getPool, sql } from '../config/db.js';

export const Department = {
  async findAll() {
    const res = await getPool().request().query('SELECT id, name, blockId FROM Departments ORDER BY createdAt ASC');
    return res.recordset;
  },

  async findById(id) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .query('SELECT id, name, blockId FROM Departments WHERE id = @id');
    return res.recordset[0] || null;
  },

  async create({ id, name, blockId }) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), (id || '').trim())
      .input('name', sql.NVarChar(255), (name || '').trim())
      .input('blockId', sql.NVarChar(100), (blockId || '').trim())
      .query('INSERT INTO Departments (id, name, blockId) OUTPUT INSERTED.id, INSERTED.name, INSERTED.blockId VALUES (@id, @name, @blockId)');
    return res.recordset[0];
  },

  async updateById(id, { name, blockId }) {
    const sets = ['updatedAt = SYSUTCDATETIME()'];
    const req = getPool().request().input('id', sql.NVarChar(100), id);
    if (name !== undefined) {
      sets.push('name = @name');
      req.input('name', sql.NVarChar(255), (name || '').trim());
    }
    if (blockId !== undefined) {
      sets.push('blockId = @blockId');
      req.input('blockId', sql.NVarChar(100), (blockId || '').trim());
    }
    const res = await req.query(
      `UPDATE Departments SET ${sets.join(', ')} OUTPUT INSERTED.id, INSERTED.name, INSERTED.blockId WHERE id = @id`
    );
    return res.recordset[0] || null;
  },

  async deleteById(id) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM Departments OUTPUT DELETED.id, DELETED.name, DELETED.blockId WHERE id = @id');
    return res.recordset[0] || null;
  },

  async deleteByBlockId(blockId) {
    await getPool()
      .request()
      .input('blockId', sql.NVarChar(100), blockId)
      .query('DELETE FROM Departments WHERE blockId = @blockId');
  },

  async countByBlockId(blockId) {
    const res = await getPool()
      .request()
      .input('blockId', sql.NVarChar(100), blockId)
      .query('SELECT COUNT(*) AS cnt FROM Departments WHERE blockId = @blockId');
    return res.recordset[0].cnt;
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM Departments');
  },
};
