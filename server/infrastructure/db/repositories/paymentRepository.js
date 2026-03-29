import crypto from 'node:crypto';
import { PaymentRepositoryPort } from '../../../application/ports/repositories/paymentRepositoryPort.js';

const toDate = (value) => (value ? new Date(value) : null);
const ensureId = (id) => id || crypto.randomUUID();

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    invoiceId: row.invoice_id,
    amount: row.amount,
    method: row.method,
    status: row.status,
    createdAt: toDate(row.created_at),
  };
};

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
    return rows.map(toEntity);
  }

  async create(payment) {
    const id = ensureId(payment.id);
    await this.pool.query(
      `INSERT INTO payments (id, patient_id, invoice_id, amount, method, status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, payment.patientId, payment.invoiceId ?? null, payment.amount, payment.method ?? null, payment.status ?? 'initiated'],
    );
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM payments WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }
}
