import crypto from 'node:crypto';
import { MessageRepositoryPort } from '../../../application/ports/repositories/messageRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    fromPatientId: row.from_patient_id,
    toDoctorId: row.to_doctor_id,
    fromDoctorId: row.from_doctor_id,
    toPatientId: row.to_patient_id,
    subject: row.subject,
    content: row.content,
    createdAt: toDate(row.created_at),
  };
};

export class SqlMessageRepository extends MessageRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async create(message) {
    const id = ensureId(message.id);
    await this.pool.query(
      `INSERT INTO messages (id, from_patient_id, to_doctor_id, from_doctor_id, to_patient_id, subject, content)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        message.fromPatientId ?? null,
        message.toDoctorId ?? null,
        message.fromDoctorId ?? null,
        message.toPatientId ?? null,
        message.subject ?? null,
        message.content,
      ],
    );
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM messages WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }
}
