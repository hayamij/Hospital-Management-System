import { PrescriptionRepositoryPort } from '../../application/ports/repositories/prescriptionRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class PrescriptionRepositoryAdapter extends PrescriptionRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async findById(id) { return toPlain(await this.inner.findById(id)); }
  async listByPatient(patientId) { return toPlain(await this.inner.listByPatient(patientId)); }
}
