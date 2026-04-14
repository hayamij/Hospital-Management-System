import crypto from 'node:crypto';
import { PaymentRepositoryPort } from '../../../application/ports/repositories/paymentRepositoryPort.js';

const toDate = (value) => (value ? new Date(value) : null);
const ensureId = (id) => id || crypto.randomUUID();
const MAX_TRANSFER_REFERENCE_LENGTH = 64;

const sanitizeTransferReference = (value) =>
  String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9._/-]/g, '')
    .slice(0, MAX_TRANSFER_REFERENCE_LENGTH);

const normalizeMethod = (value) => String(value || 'bank_transfer').trim().toLowerCase() || 'bank_transfer';

const parseStoredMethod = (storedMethod, explicitTransferReference) => {
  const rawMethod = String(storedMethod || '').trim().toLowerCase();
  const transferReference = sanitizeTransferReference(explicitTransferReference);

  if (transferReference) {
    return {
      method: rawMethod || 'bank_transfer',
      transferReference,
      rawMethod: rawMethod || null,
    };
  }

  if (!rawMethod) {
    return { method: null, transferReference: null, rawMethod: null };
  }

  const [method, ...rest] = rawMethod.split(':');
  const legacyTransferReference = rest.length ? sanitizeTransferReference(rest.join(':')) : null;

  return {
    method,
    transferReference: legacyTransferReference,
    rawMethod,
  };
};

const toEntity = (row) => {
  if (!row) return null;
  const parsedMethod = parseStoredMethod(row.method, row.transfer_reference);

  return {
    id: row.id,
    patientId: row.patient_id,
    invoiceId: row.invoice_id,
    amount: Number(row.amount) || 0,
    method: parsedMethod.method,
    transferReference: parsedMethod.transferReference,
    rawMethod: parsedMethod.rawMethod,
    status: row.status,
    createdAt: toDate(row.created_at),
    invoiceNumber: row.invoice_number ?? null,
    invoiceStatus: row.invoice_status ?? null,
    billingDoctorId: row.billing_doctor_id ?? null,
    patientName: row.patient_name ?? null,
    assignedDoctorId: row.assigned_doctor_id ?? null,
  };
};

export class SqlPaymentRepository extends PaymentRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
    this.ensureTransferReferenceColumnPromise = null;
    this.ensureBillingDoctorIdColumnPromise = null;
  }

  async ensureTransferReferenceColumn() {
    if (this.ensureTransferReferenceColumnPromise) {
      return this.ensureTransferReferenceColumnPromise;
    }

    this.ensureTransferReferenceColumnPromise = (async () => {
      const existing = await this.pool.query(
        `SELECT COL_LENGTH('payments', 'transfer_reference') AS has_column`
      );
      const hasColumn = existing.rows?.[0]?.has_column !== null && existing.rows?.[0]?.has_column !== undefined;

      if (hasColumn) {
        return;
      }

      await this.pool.query(
        `ALTER TABLE payments
           ADD transfer_reference NVARCHAR(${MAX_TRANSFER_REFERENCE_LENGTH}) NULL`
      );

      // Backfill legacy rows where transfer reference was encoded into method as bank_transfer:<reference>.
      await this.pool.query(
        `UPDATE payments
            SET transfer_reference = LEFT(LTRIM(RTRIM(SUBSTRING(method, CHARINDEX(':', method) + 1, 200))), ${MAX_TRANSFER_REFERENCE_LENGTH}),
                method = LOWER(LTRIM(RTRIM(LEFT(method, CHARINDEX(':', method) - 1))))
          WHERE method IS NOT NULL
            AND CHARINDEX(':', method) > 0`
      );
    })().catch((error) => {
      this.ensureTransferReferenceColumnPromise = null;
      throw error;
    });

    return this.ensureTransferReferenceColumnPromise;
  }

  async ensureBillingDoctorIdColumn() {
    if (this.ensureBillingDoctorIdColumnPromise) {
      return this.ensureBillingDoctorIdColumnPromise;
    }

    this.ensureBillingDoctorIdColumnPromise = (async () => {
      const existing = await this.pool.query(
        `SELECT COL_LENGTH('billings', 'doctor_id') AS has_column`
      );
      const hasColumn = existing.rows?.[0]?.has_column !== null && existing.rows?.[0]?.has_column !== undefined;

      if (hasColumn) {
        return;
      }

      await this.pool.query(
        `ALTER TABLE billings
           ADD doctor_id NVARCHAR(64) NULL`
      );

      await this.pool.query(
        `UPDATE b
            SET doctor_id = p.assigned_doctor_id
           FROM billings b
           JOIN patients p ON p.id = b.patient_id
          WHERE b.doctor_id IS NULL`
      );
    })().catch((error) => {
      this.ensureBillingDoctorIdColumnPromise = null;
      throw error;
    });

    return this.ensureBillingDoctorIdColumnPromise;
  }

  async listByPatient(patientId) {
    await this.ensureTransferReferenceColumn();
    await this.ensureBillingDoctorIdColumn();

    const { rows } = await this.pool.query(
      `SELECT
          p.*,
          b.invoice_number,
          b.status AS invoice_status
       FROM payments p
       LEFT JOIN billings b ON b.id = p.invoice_id
       WHERE p.patient_id = $1
       ORDER BY p.created_at DESC`,
      [patientId],
    );
    return rows.map(toEntity);
  }

  async create(payment) {
    await this.ensureTransferReferenceColumn();

    const id = ensureId(payment.id);
    const storedMethod = normalizeMethod(payment.method);
    const transferReference = sanitizeTransferReference(payment.transferReference);

    await this.pool.query(
      `INSERT INTO payments (id, patient_id, invoice_id, amount, method, transfer_reference, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        payment.patientId,
        payment.invoiceId ?? null,
        Number(payment.amount) || 0,
        storedMethod,
        transferReference || null,
        payment.status ?? 'initiated',
      ],
    );
    return this.findById(id);
  }

  async findById(id) {
    await this.ensureTransferReferenceColumn();
    await this.ensureBillingDoctorIdColumn();

    const { rows } = await this.pool.query(
      `SELECT
          p.*,
          b.invoice_number,
          b.status AS invoice_status,
          b.doctor_id AS billing_doctor_id,
          pa.full_name AS patient_name,
          pa.assigned_doctor_id
       FROM payments p
       LEFT JOIN billings b ON b.id = p.invoice_id
       LEFT JOIN patients pa ON pa.id = p.patient_id
       WHERE p.id = $1 LIMIT 1`,
      [id]
    );
    return toEntity(rows[0]);
  }

  async updateStatus(paymentId, status) {
    await this.ensureTransferReferenceColumn();

    await this.pool.query(
      `UPDATE payments
         SET status = $1
       WHERE id = $2`,
      [status, paymentId],
    );
    return this.findById(paymentId);
  }

  async listPendingForDoctor(doctorId, { page = 1, pageSize = 20, status } = {}) {
    await this.ensureTransferReferenceColumn();
    await this.ensureBillingDoctorIdColumn();

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const offset = (safePage - 1) * safePageSize;

    const normalizedStatuses = [
      ...new Set(
        String(status || '')
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
    const statusFilters = normalizedStatuses.length
      ? normalizedStatuses
      : ['pending_confirmation', 'initiated', 'processing'];

    const values = [doctorId, ...statusFilters];
    const statusPlaceholders = statusFilters.map((_item, index) => `$${index + 2}`).join(', ');

    const countResult = await this.pool.query(
      `SELECT COUNT(*) AS total
       FROM payments p
       JOIN billings b ON b.id = p.invoice_id
       JOIN patients pa ON pa.id = b.patient_id
       WHERE COALESCE(b.doctor_id, pa.assigned_doctor_id) = $1
         AND LOWER(COALESCE(p.status, '')) IN (${statusPlaceholders})`,
      values,
    );
    const total = Number(countResult.rows?.[0]?.total ?? 0);

    const listValues = [...values, offset, safePageSize];
    const offsetIdx = listValues.length - 1;
    const limitIdx = listValues.length;

    const listResult = await this.pool.query(
      `SELECT
          p.*,
          b.invoice_number,
          b.status AS invoice_status,
          b.doctor_id AS billing_doctor_id,
          pa.full_name AS patient_name,
          pa.assigned_doctor_id
       FROM payments p
       JOIN billings b ON b.id = p.invoice_id
       JOIN patients pa ON pa.id = b.patient_id
       WHERE COALESCE(b.doctor_id, pa.assigned_doctor_id) = $1
         AND LOWER(COALESCE(p.status, '')) IN (${statusPlaceholders})
       ORDER BY p.created_at DESC
       OFFSET $${offsetIdx} ROWS FETCH NEXT $${limitIdx} ROWS ONLY`,
      listValues,
    );

    return {
      page: safePage,
      pageSize: safePageSize,
      total,
      items: (listResult.rows || []).map(toEntity),
    };
  }
}
