import crypto from 'node:crypto';
import { AuditLogRepositoryPort } from '../../../application/ports/repositories/auditLogRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    recordId: row.record_id,
    action: row.action,
    actorId: row.actor_id,
    reason: row.reason,
    createdAt: toDate(row.created_at),
  };
};

export class SqlAuditLogRepository extends AuditLogRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async append(entry) {
    const id = ensureId(entry.id);
    const actorId = entry.actorId ?? entry.adminId ?? null;
    await this.pool.query(
      `INSERT INTO audit_logs (id, record_id, action, actor_id, reason)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, entry.recordId ?? null, entry.action ?? null, actorId, entry.reason ?? null],
    );
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM audit_logs WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async listByRecord(recordId) {
    const { rows } = await this.pool.query('SELECT * FROM audit_logs WHERE record_id = $1 ORDER BY created_at DESC', [recordId]);
    return rows.map(toEntity);
  }
}
