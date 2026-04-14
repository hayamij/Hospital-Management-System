import { PaymentRepositoryPort } from '../../application/ports/repositories/paymentRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class PaymentRepositoryAdapter extends PaymentRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async listByPatient(patientId) { return toPlain(await this.inner.listByPatient(patientId)); }

  async create(payment) { return toPlain(await this.inner.create(payment)); }

  async findById(paymentId) { return toPlain(await this.inner.findById(paymentId)); }

  async updateStatus(paymentId, status) {
    return toPlain(await this.inner.updateStatus(paymentId, status));
  }

  async listPendingForDoctor(doctorId, options = {}) {
    return toPlain(await this.inner.listPendingForDoctor(doctorId, options));
  }
}
