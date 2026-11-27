import { getPool, sql } from '../config/db.js';

export const AuditLog = {
  async create({ action, actorCode = null, actorRole = null, detail = '' }) {
    const res = await getPool()
      .request()
      .input('action', sql.NVarChar(100), action)
      .input('actorCode', sql.NVarChar(100), actorCode)
      .input('actorRole', sql.NVarChar(50), actorRole)
      .input('detail', sql.NVarChar(300), (detail || '').slice(0, 300))
      .query(
        `INSERT INTO AuditLogs (action, actorCode, actorRole, detail)
         OUTPUT INSERTED.id, INSERTED.action, INSERTED.actorCode, INSERTED.actorRole, INSERTED.detail, INSERTED.createdAt
         VALUES (@action, @actorCode, @actorRole, @detail)`
      );
    return res.recordset[0];
  },

  async findRecent({ action, limit = 50, page = 1 } = {}) {
    const req = getPool()
      .request()
      .input('offset', sql.Int, (page - 1) * limit)
      .input('limit', sql.Int, limit);
    const where = action ? 'WHERE action = @action' : '';
    if (action) req.input('action', sql.NVarChar(100), action);

    const res = await req.query(
      `SELECT id, action, actorCode, actorRole, detail, createdAt
       FROM AuditLogs ${where}
       ORDER BY createdAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );
    return res.recordset;
  },

  async count({ action, since } = {}) {
    const req = getPool().request();
    const conditions = [];
    if (action) {
      conditions.push('action = @action');
      req.input('action', sql.NVarChar(100), action);
    }
    if (since) {
      conditions.push('createdAt >= @since');
      req.input('since', sql.DateTime2, since);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await req.query(`SELECT COUNT(*) AS cnt FROM AuditLogs ${where}`);
    return res.recordset[0].cnt;
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM AuditLogs');
  },
};
