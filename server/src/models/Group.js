import { getPool, sql } from '../config/db.js';

function parseGroup(row) {
  if (!row) return null;
  let blockIds = [];
  try {
    blockIds = JSON.parse(row.blockIds || '[]');
  } catch {
    blockIds = [];
  }
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    isSystem: Boolean(row.isSystem),
    checkInRequired: Boolean(row.checkInRequired),
    blockIds,
  };
}

export const Group = {
  async findAll() {
    const res = await getPool()
      .request()
      .query('SELECT id, name, color, isSystem, checkInRequired, blockIds FROM Groups ORDER BY createdAt ASC');
    return res.recordset.map(parseGroup);
  },

  async findById(id) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .query('SELECT id, name, color, isSystem, checkInRequired, blockIds FROM Groups WHERE id = @id');
    return parseGroup(res.recordset[0]);
  },

  async create({ id, name, color, isSystem = false, checkInRequired = true, blockIds = [] }) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), (id || '').trim())
      .input('name', sql.NVarChar(255), (name || '').trim())
      .input('color', sql.NVarChar(50), (color || '').trim())
      .input('isSystem', sql.Bit, isSystem ? 1 : 0)
      .input('checkInRequired', sql.Bit, checkInRequired ? 1 : 0)
      .input('blockIds', sql.NVarChar(sql.MAX), JSON.stringify(blockIds || []))
      .query(
        `INSERT INTO Groups (id, name, color, isSystem, checkInRequired, blockIds)
         OUTPUT INSERTED.id, INSERTED.name, INSERTED.color, INSERTED.isSystem, INSERTED.checkInRequired, INSERTED.blockIds
         VALUES (@id, @name, @color, @isSystem, @checkInRequired, @blockIds)`
      );
    return parseGroup(res.recordset[0]);
  },

  async updateById(id, data) {
    const sets = ['updatedAt = SYSUTCDATETIME()'];
    const req = getPool().request().input('id', sql.NVarChar(100), id);

    if (data.name !== undefined) {
      sets.push('name = @name');
      req.input('name', sql.NVarChar(255), (data.name || '').trim());
    }
    if (data.color !== undefined) {
      sets.push('color = @color');
      req.input('color', sql.NVarChar(50), (data.color || '').trim());
    }
    if (data.checkInRequired !== undefined) {
      sets.push('checkInRequired = @checkInRequired');
      req.input('checkInRequired', sql.Bit, data.checkInRequired ? 1 : 0);
    }
    if (data.blockIds !== undefined) {
      sets.push('blockIds = @blockIds');
      req.input('blockIds', sql.NVarChar(sql.MAX), JSON.stringify(data.blockIds || []));
    }

    const res = await req.query(
      `UPDATE Groups SET ${sets.join(', ')} OUTPUT INSERTED.id, INSERTED.name, INSERTED.color, INSERTED.isSystem, INSERTED.checkInRequired, INSERTED.blockIds WHERE id = @id`
    );
    return parseGroup(res.recordset[0]);
  },

  async deleteById(id) {
    const res = await getPool()
      .request()
      .input('id', sql.NVarChar(100), id)
      .query('DELETE FROM Groups OUTPUT DELETED.id, DELETED.name WHERE id = @id');
    return res.recordset[0] || null;
  },

  async removeBlockIdFromAll(blockId) {
    const groups = await this.findAll();
    for (const g of groups) {
      if (g.blockIds.includes(blockId)) {
        await this.updateById(g.id, { blockIds: g.blockIds.filter((b) => b !== blockId) });
      }
    }
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM Groups');
  },
};
