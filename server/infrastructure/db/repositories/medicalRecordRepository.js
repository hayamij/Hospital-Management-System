import crypto from 'node:crypto';
import { MedicalRecordRepositoryPort } from '../../../application/ports/repositories/medicalRecordRepositoryPort.js';
import { MedicalRecord } from '../../../domain/entities/medicalRecord.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  const entries = typeof row.entries === 'string' ? JSON.parse(row.entries) : row.entries ?? [];
  return new MedicalRecord({
    id: row.id,
    patientId: row.patient_id,
    entries,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  });
};

export class SqlMedicalRecordRepository extends MedicalRecordRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM medical_records WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async findByPatientId(patientId) {
    const { rows } = await this.pool.query('SELECT * FROM medical_records WHERE patient_id = $1 LIMIT 1', [patientId]);
    return toEntity(rows[0]);
  }

  async save(record) {
    const id = ensureId(record.id);
    const entries = Array.isArray(record.entries) ? JSON.stringify(record.entries) : record.entries;

    const existing = await this.findById(id);
    if (existing) {
      await this.pool.query(
        `UPDATE medical_records
           SET patient_id = $1,
               entries = $2,
               updated_at = now()
         WHERE id = $3`,
        [record.patientId, entries ?? '[]', id],
      );
      return this.findById(id);
    }

    await this.pool.query(
      `INSERT INTO medical_records (id, patient_id, entries)
       VALUES ($1,$2,$3)`,
      [id, record.patientId, entries ?? '[]'],
    );
    return this.findById(id);
  }
}
