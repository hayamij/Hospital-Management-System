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

  async list({ status, patientId, page = 1, pageSize = 20 } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const offset = (safePage - 1) * safePageSize;

    const filters = [];
    const values = [];

    if (status) {
      values.push(String(status).trim().toLowerCase());
      filters.push(`LOWER(COALESCE(status, '')) = $${values.length}`);
    }

    if (patientId) {
      values.push(patientId);
      filters.push(`patient_id = $${values.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) AS total FROM billings ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = Number(countResult.rows?.[0]?.total ?? 0);

    const listValues = [...values, offset, safePageSize];
    const offsetIdx = listValues.length - 1;
    const limitIdx = listValues.length;

    const listQuery = `
      SELECT *
      FROM billings
      ${whereClause}
      ORDER BY created_at DESC
      OFFSET $${offsetIdx} ROWS FETCH NEXT $${limitIdx} ROWS ONLY`;

    const listResult = await this.pool.query(listQuery, listValues);

    return {
      page: safePage,
      pageSize: safePageSize,
      total,
      items: (listResult.rows || []).map(toEntity),
    };
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
