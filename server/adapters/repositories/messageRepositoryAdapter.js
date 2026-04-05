import { MessageRepositoryPort } from '../../application/ports/repositories/messageRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class MessageRepositoryAdapter extends MessageRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async create(message) { return toPlain(await this.inner.create(message)); }

  async listForDoctor(doctorId, options = {}) {
    return toPlain(await this.inner.listForDoctor(doctorId, options));
  }

  async listForPatient(patientId, options = {}) {
    return toPlain(await this.inner.listForPatient(patientId, options));
  }
}
