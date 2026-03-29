import crypto from 'node:crypto';
import { BillingRepositoryPort } from '../../../application/ports/repositories/billingRepositoryPort.js';
import { Billing } from '../../../domain/entities/billing.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);
const normalizeCharges = (rawCharges) => {
  if (!Array.isArray(rawCharges)) return [];
  return rawCharges
    .map((line) => ({
      ...line,
      description: String(line?.description ?? line?.item ?? '').trim(),
      amount: Number(line?.amount ?? 0),
    }))
    .filter((line) => line.description && Number.isFinite(line.amount));
};

const toEntity = (row) => {
  if (!row) return null;
  const rawCharges = typeof row.charges === 'string' ? JSON.parse(row.charges) : row.charges;
  return new Billing({
    id: row.id,
    invoiceNumber: row.invoice_number,
    patientId: row.patient_id,
    charges: normalizeCharges(rawCharges),
    status: row.status,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
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
    const id = ensureId(billing.id);
    const charges = Array.isArray(billing.charges)
      ? JSON.stringify(normalizeCharges(billing.charges))
      : billing.charges;
    const status = billing.status ?? 'draft';
    const dueDate = billing.dueDate ? new Date(billing.dueDate).toISOString() : null;

    const existing = await this.findById(id);
    if (existing) {
      await this.pool.query(
        `UPDATE billings
           SET invoice_number = $1,
               patient_id = $2,
               charges = $3,
               status = $4,
               due_date = $5,
               updated_at = now()
         WHERE id = $6`,
        [billing.invoiceNumber, billing.patientId, charges, status, dueDate, id],
      );
      return this.findById(id);
    }

    await this.pool.query(
      `INSERT INTO billings (id, invoice_number, patient_id, charges, status, due_date)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, billing.invoiceNumber, billing.patientId, charges, status, dueDate],
    );
    return this.findById(id);
  }
}
