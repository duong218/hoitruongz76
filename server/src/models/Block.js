import { getPool, sql } from '../config/db.js';

export const Block = {
  async findAll() {
    const res = await getPool().request().query('SELECT id, name FROM Blocks ORDER BY createdAt ASC');
    return res.recordset;
  },

  async findById(id) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .query('SELECT id, name FROM Blocks WHERE id = @id');
    return res.recordset[0] || null;
  },

  async create({ id, name }) {
    const trimmedName = (name || '').trim();
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), (id || '').trim())
      .input('name', sql.NVarChar(255), trimmedName)
      .query('INSERT INTO Blocks (id, name) OUTPUT INSERTED.id, INSERTED.name VALUES (@id, @name)');
    return res.recordset[0];
  },

  async updateById(id, { name }) {
    const trimmedName = (name || '').trim();
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .input('name', sql.NVarChar(255), trimmedName)
      .query('UPDATE Blocks SET name = @name, updatedAt = SYSUTCDATETIME() OUTPUT INSERTED.id, INSERTED.name WHERE id = @id');
    return res.recordset[0] || null;
  },

  async deleteById(id) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM Blocks OUTPUT DELETED.id, DELETED.name WHERE id = @id');
    return res.recordset[0] || null;
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM Blocks');
  },
};
