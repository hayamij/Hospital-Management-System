import { MedicalRecordRepositoryPort } from '../../application/ports/repositories/medicalRecordRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class MedicalRecordRepositoryAdapter extends MedicalRecordRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async findById(id) { return toPlain(await this.inner.findById(id)); }

  async findByPatientId(patientId) { return toPlain(await this.inner.findByPatientId(patientId)); }

  async save(record) { return toPlain(await this.inner.save(record)); }
}
