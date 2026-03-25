import crypto from 'node:crypto';
import { PrescriptionRepositoryPort } from '../../../application/ports/repositories/prescriptionRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
    createdAt: toDate(row.created_at),
  };
};

export class SqlPrescriptionRepository extends PrescriptionRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM prescriptions WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async listByPatient(patientId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId],
    );
    return rows.map(toEntity);
  }

  async create(prescription) {
    const id = ensureId(prescription.id);
    const content = typeof prescription.content === 'string' ? prescription.content : JSON.stringify(prescription.content ?? {});
    await this.pool.query(
      `INSERT INTO prescriptions (id, patient_id, doctor_id, content)
       VALUES ($1,$2,$3,$4)`,
      [id, prescription.patientId, prescription.doctorId, content],
    );
    return this.findById(id);
  }
}
