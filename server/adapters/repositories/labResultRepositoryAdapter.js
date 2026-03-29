import { LabResultRepositoryPort } from '../../application/ports/repositories/labResultRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class LabResultRepositoryAdapter extends LabResultRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async findById(id) { return toPlain(await this.inner.findById(id)); }
  async save(labResult) { return toPlain(await this.inner.save(labResult)); }
}
