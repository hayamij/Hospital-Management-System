import { ReportRepositoryPort } from '../../application/ports/repositories/reportRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class ReportRepositoryAdapter extends ReportRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async run(reportName, params) { return toPlain(await this.inner.run(reportName, params)); }
}
