import { getPool, sql } from '../config/db.js';

function parseEventSetting(row) {
  if (!row) return null;
  return {
    eventName: row.eventName,
    guestEnabled: Boolean(row.guestEnabled),
    checkInOpen: Boolean(row.checkInOpen),
    seatMode: row.seatMode,
    appUrl: row.appUrl,
    nameLocked: Boolean(row.nameLocked),
    startedAt: row.startedAt,
    opensAt: row.opensAt,
    closesAt: row.closesAt,
    endHandledAt: row.endHandledAt,
    archivedId: row.archivedId,
  };
}

export const EventSetting = {
  async getMain() {
    const res = await getPool()
      .request()
      .query(
        'SELECT eventName, guestEnabled, checkInOpen, seatMode, appUrl, nameLocked, startedAt, opensAt, closesAt, endHandledAt, archivedId FROM EventSettings WHERE [key] = \'main\''
      );
    return parseEventSetting(res.recordset[0]);
  },

  async upsertMain(data) {
    const existing = await this.getMain();
    const pool = getPool();
    if (!existing) {
      const res = await pool
        .request()
        .input('eventName', sql.NVarChar(255), (data.eventName || 'Sự kiện').trim())
        .input('guestEnabled', sql.Bit, data.guestEnabled !== false ? 1 : 0)
        .input('checkInOpen', sql.Bit, data.checkInOpen !== false ? 1 : 0)
        .input('seatMode', sql.NVarChar(50), data.seatMode || 'group')
        .input('appUrl', sql.NVarChar(500), (data.appUrl || '').trim())
        .input('nameLocked', sql.Bit, data.nameLocked ? 1 : 0)
        .input('startedAt', sql.DateTime2, data.startedAt || null)
        .input('opensAt', sql.DateTime2, data.opensAt || null)
        .input('closesAt', sql.DateTime2, data.closesAt || null)
        .input('endHandledAt', sql.DateTime2, data.endHandledAt || null)
        .input('archivedId', sql.NVarChar(100), data.archivedId ? String(data.archivedId) : null)
        .query(
          `INSERT INTO EventSettings ([key], eventName, guestEnabled, checkInOpen, seatMode, appUrl, nameLocked, startedAt, opensAt, closesAt, endHandledAt, archivedId)
           OUTPUT INSERTED.eventName, INSERTED.guestEnabled, INSERTED.checkInOpen, INSERTED.seatMode, INSERTED.appUrl, INSERTED.nameLocked, INSERTED.startedAt, INSERTED.opensAt, INSERTED.closesAt, INSERTED.endHandledAt, INSERTED.archivedId
           VALUES ('main', @eventName, @guestEnabled, @checkInOpen, @seatMode, @appUrl, @nameLocked, @startedAt, @opensAt, @closesAt, @endHandledAt, @archivedId)`
        );
      return parseEventSetting(res.recordset[0]);
    }

    const sets = ['updatedAt = SYSUTCDATETIME()'];
    const req = pool.request();
    if (data.eventName !== undefined) {
      sets.push('eventName = @eventName');
      req.input('eventName', sql.NVarChar(255), (data.eventName || '').trim());
    }
    if (data.guestEnabled !== undefined) {
      sets.push('guestEnabled = @guestEnabled');
      req.input('guestEnabled', sql.Bit, data.guestEnabled ? 1 : 0);
    }
    if (data.checkInOpen !== undefined) {
      sets.push('checkInOpen = @checkInOpen');
      req.input('checkInOpen', sql.Bit, data.checkInOpen ? 1 : 0);
    }
    if (data.seatMode !== undefined) {
      sets.push('seatMode = @seatMode');
      req.input('seatMode', sql.NVarChar(50), data.seatMode);
    }
    if (data.appUrl !== undefined) {
      sets.push('appUrl = @appUrl');
      req.input('appUrl', sql.NVarChar(500), (data.appUrl || '').trim());
    }
    if (data.nameLocked !== undefined) {
      sets.push('nameLocked = @nameLocked');
      req.input('nameLocked', sql.Bit, data.nameLocked ? 1 : 0);
    }
    if (data.startedAt !== undefined) {
      sets.push('startedAt = @startedAt');
      req.input('startedAt', sql.DateTime2, data.startedAt);
    }
    if (data.opensAt !== undefined) {
      sets.push('opensAt = @opensAt');
      req.input('opensAt', sql.DateTime2, data.opensAt);
    }
    if (data.closesAt !== undefined) {
      sets.push('closesAt = @closesAt');
      req.input('closesAt', sql.DateTime2, data.closesAt);
    }
    if (data.endHandledAt !== undefined) {
      sets.push('endHandledAt = @endHandledAt');
      req.input('endHandledAt', sql.DateTime2, data.endHandledAt);
    }
    if (data.archivedId !== undefined) {
      sets.push('archivedId = @archivedId');
      req.input('archivedId', sql.NVarChar(100), data.archivedId ? String(data.archivedId) : null);
    }

    const res = await req.query(
      `UPDATE EventSettings SET ${sets.join(', ')} OUTPUT INSERTED.eventName, INSERTED.guestEnabled, INSERTED.checkInOpen, INSERTED.seatMode, INSERTED.appUrl, INSERTED.nameLocked, INSERTED.startedAt, INSERTED.opensAt, INSERTED.closesAt, INSERTED.endHandledAt, INSERTED.archivedId WHERE [key] = 'main'`
    );
    return parseEventSetting(res.recordset[0]);
  },

  async deleteAll() {
    await getPool().request().query('DELETE FROM EventSettings');
  },
};
