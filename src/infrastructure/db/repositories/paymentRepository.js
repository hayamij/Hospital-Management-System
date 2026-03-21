import { PaymentRepositoryPort } from '../../../application/ports/repositories/paymentRepositoryPort.js';

export class SqlPaymentRepository extends PaymentRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listByPatient(patientId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM payments WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId],
    );
    return rows;
  }
}
