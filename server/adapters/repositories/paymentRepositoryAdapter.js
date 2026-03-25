import { PaymentRepositoryPort } from '../../application/ports/repositories/paymentRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class PaymentRepositoryAdapter extends PaymentRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async listByPatient(patientId) { return toPlain(await this.inner.listByPatient(patientId)); }
}
