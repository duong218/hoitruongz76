import { getPool, sql } from '../config/db.js';

function parseArchive(row, includeRows = true) {
  if (!row) return null;
  let summary = {};
  try {
    summary = JSON.parse(row.summary || '{}');
  } catch {
    summary = {};
  }
  const result = {
    id: String(row.id),
    eventName: row.eventName,
    startedAt: row.startedAt,
    archivedAt: row.archivedAt,
    archivedBy: row.archivedBy,
    cause: row.cause,
    summary,
  };
  if (includeRows) {
    try {
      result.rows = JSON.parse(row.rows || '[]');
    } catch {
      result.rows = [];
    }
  }
  return result;
}

export const EventArchive = {
  async findAllSummaries() {
    const res = await getPool()
      .request()
      .query('SELECT id, eventName, startedAt, archivedAt, archivedBy, cause, summary FROM EventArchives ORDER BY archivedAt DESC');
    return res.recordset.map((r) => parseArchive(r, false));
  },

  async findById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return null;
    const res = await getPool()
      .request()
      .input('id', sql.Int, numericId)
      .query('SELECT id, eventName, startedAt, archivedAt, archivedBy, cause, summary, rows FROM EventArchives WHERE id = @id');
    return parseArchive(res.recordset[0], true);
  },

  async create({ eventName, startedAt = null, archivedBy = '', cause, summary = {}, rows = [] }) {
    const res = await getPool()
      .request()
      .input('eventName', sql.NVarChar(255), eventName)
      .input('startedAt', sql.DateTime2, startedAt)
      .input('archivedBy', sql.NVarChar(100), archivedBy || '')
      .input('cause', sql.NVarChar(50), cause)
      .input('summary', sql.NVarChar(sql.MAX), JSON.stringify(summary))
      .input('rows', sql.NVarChar(sql.MAX), JSON.stringify(rows))
      .query(
        `INSERT INTO EventArchives (eventName, startedAt, archivedBy, cause, summary, rows)
         OUTPUT INSERTED.id, INSERTED.eventName, INSERTED.startedAt, INSERTED.archivedAt, INSERTED.archivedBy, INSERTED.cause, INSERTED.summary, INSERTED.rows
         VALUES (@eventName, @startedAt, @archivedBy, @cause, @summary, @rows)`
      );
    return parseArchive(res.recordset[0], true);
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM EventArchives');
  },
};
