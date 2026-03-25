import crypto from 'node:crypto';
import { LabResultRepositoryPort } from '../../../application/ports/repositories/labResultRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
    status: row.status,
    createdAt: toDate(row.created_at),
  };
};

export class SqlLabResultRepository extends LabResultRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM lab_results WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async save(labResult) {
    const id = ensureId(labResult.id);
    const content = typeof labResult.content === 'string' ? labResult.content : JSON.stringify(labResult.content ?? {});
    const existing = await this.findById(id);
    if (existing) {
      await this.pool.query(
        `UPDATE lab_results
           SET patient_id = $1,
               doctor_id = $2,
               content = $3,
               status = $4
         WHERE id = $5`,
        [labResult.patientId, labResult.doctorId ?? null, content, labResult.status ?? existing.status ?? 'pending', id],
      );
      return this.findById(id);
    }

    await this.pool.query(
      `INSERT INTO lab_results (id, patient_id, doctor_id, content, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, labResult.patientId, labResult.doctorId ?? null, content, labResult.status ?? 'pending'],
    );
    return this.findById(id);
  }
}
