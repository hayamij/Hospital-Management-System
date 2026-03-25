import { AuditLogRepositoryPort } from '../../application/ports/repositories/auditLogRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class AuditLogRepositoryAdapter extends AuditLogRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async append(entry) { return toPlain(await this.inner.append(entry)); }
}
