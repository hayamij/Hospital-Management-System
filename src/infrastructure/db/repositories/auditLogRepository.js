import { AuditLogRepositoryPort } from '../../../application/ports/repositories/auditLogRepositoryPort.js';

// SQL repository stub for audit logs. Wire pool and implement queries later.
export class SqlAuditLogRepository extends AuditLogRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async append(entry) {
    // TODO: implement persistence
    throw new Error('SqlAuditLogRepository.append not implemented');
  }
}
