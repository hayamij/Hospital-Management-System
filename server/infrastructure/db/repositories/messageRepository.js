import crypto from 'node:crypto';
import { MessageRepositoryPort } from '../../../application/ports/repositories/messageRepositoryPort.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);
const toPositiveInt = (value, fallback = 20, max = 200) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
};

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

  async listForDoctor(doctorId, { patientId, limit } = {}) {
    const safeLimit = toPositiveInt(limit);
    const values = [doctorId];
    const conditions = ['(to_doctor_id = $1 OR from_doctor_id = $1)'];

    if (patientId) {
      values.push(patientId);
      conditions.push(`(from_patient_id = $${values.length} OR to_patient_id = $${values.length})`);
    }

    values.push(safeLimit);
    const limitParamIdx = values.length;
    const where = conditions.join(' AND ');
    const { rows } = await this.pool.query(
      `SELECT *
         FROM messages
        WHERE ${where}
        ORDER BY created_at DESC
        OFFSET 0 ROWS FETCH NEXT $${limitParamIdx} ROWS ONLY`,
      values,
    );

    return rows.map(toEntity);
  }

  async listForPatient(patientId, { doctorId, limit } = {}) {
    const safeLimit = toPositiveInt(limit);
    const values = [patientId];
    const conditions = ['(from_patient_id = $1 OR to_patient_id = $1)'];

    if (doctorId) {
      values.push(doctorId);
      conditions.push(`(to_doctor_id = $${values.length} OR from_doctor_id = $${values.length})`);
    }

    values.push(safeLimit);
    const limitParamIdx = values.length;
    const where = conditions.join(' AND ');
    const { rows } = await this.pool.query(
      `SELECT *
         FROM messages
        WHERE ${where}
        ORDER BY created_at DESC
        OFFSET 0 ROWS FETCH NEXT $${limitParamIdx} ROWS ONLY`,
      values,
    );

    return rows.map(toEntity);
  }
}
