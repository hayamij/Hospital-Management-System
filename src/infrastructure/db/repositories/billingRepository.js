import { BillingRepositoryPort } from '../../../application/ports/repositories/billingRepositoryPort.js';
import { Billing } from '../../../domain/entities/billing.js';

const toEntity = (row) => {
  if (!row) return null;
  return new Billing({
    id: row.id,
    invoiceNumber: row.invoice_number,
    patientId: row.patient_id,
    charges: row.charges,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export class SqlBillingRepository extends BillingRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM billings WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async listByPatient(patientId) {
    const { rows } = await this.pool.query('SELECT * FROM billings WHERE patient_id = $1 ORDER BY created_at DESC', [patientId]);
    return rows.map(toEntity);
  }

  async save(billing) {
    if (billing.id) {
      const { rows } = await this.pool.query(
        `UPDATE billings
           SET invoice_number = $1,
               patient_id = $2,
               charges = $3,
               status = $4,
               due_date = $5,
               updated_at = now()
         WHERE id = $6
         RETURNING *`,
        [billing.invoiceNumber, billing.patientId, billing.charges, billing.status, billing.dueDate ?? null, billing.id],
      );
      return toEntity(rows[0]);
    }

    const { rows } = await this.pool.query(
      `INSERT INTO billings (invoice_number, patient_id, charges, status, due_date)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [billing.invoiceNumber, billing.patientId, billing.charges, billing.status ?? 'draft', billing.dueDate ?? null],
    );
    return toEntity(rows[0]);
  }
}
