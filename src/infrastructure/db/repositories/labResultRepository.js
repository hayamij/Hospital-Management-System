import { LabResultRepositoryPort } from '../../../application/ports/repositories/labResultRepositoryPort.js';

// SQL repository stub for lab results.
export class SqlLabResultRepository extends LabResultRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    throw new Error('SqlLabResultRepository.findById not implemented');
  }

  async save(labResult) {
    throw new Error('SqlLabResultRepository.save not implemented');
  }
}
