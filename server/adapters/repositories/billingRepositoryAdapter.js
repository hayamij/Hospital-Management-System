import { BillingRepositoryPort } from '../../application/ports/repositories/billingRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class BillingRepositoryAdapter extends BillingRepositoryPort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async findById(id) {
    return toPlain(await this.inner.findById(id));
  }

  async listByPatient(patientId) {
    return toPlain(await this.inner.listByPatient(patientId));
  }

  async list(options = {}) {
    return toPlain(await this.inner.list(options));
  }

  async listByDoctor(doctorId, options = {}) {
    return toPlain(await this.inner.listByDoctor(doctorId, options));
  }

  async save(billing) {
    return toPlain(await this.inner.save(billing));
  }
}
