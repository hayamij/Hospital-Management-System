import { MedicalRecordRepositoryPort } from '../../../application/ports/repositories/medicalRecordRepositoryPort.js';
import { MedicalRecord } from '../../../domain/entities/medicalRecord.js';

const toEntity = (row) => {
  if (!row) return null;
  return new MedicalRecord({
    id: row.id,
    patientId: row.patient_id,
    entries: row.entries ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    if (record.id) {
      const { rows } = await this.pool.query(
        `UPDATE medical_records
           SET patient_id = $1,
               entries = $2,
               updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [record.patientId, record.entries ?? [], record.id],
      );
      return toEntity(rows[0]);
    }

    const { rows } = await this.pool.query(
      `INSERT INTO medical_records (patient_id, entries)
       VALUES ($1,$2)
       RETURNING *`,
      [record.patientId, record.entries ?? []],
    );
    return toEntity(rows[0]);
  }
}
