import { PatientRepositoryPort } from '../../application/ports/repositories/patientRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class PatientRepositoryAdapter extends PatientRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async findById(id) { return toPlain(await this.inner.findById(id)); }
  async save(patient) { return toPlain(await this.inner.save(patient)); }
  async create(patient) { return toPlain(await this.inner.create(patient)); }
}
