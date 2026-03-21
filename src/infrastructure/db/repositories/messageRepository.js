import { MessageRepositoryPort } from '../../../application/ports/repositories/messageRepositoryPort.js';

export class SqlMessageRepository extends MessageRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async create(message) {
    const { rows } = await this.pool.query(
      `INSERT INTO messages (from_patient_id, to_doctor_id, from_doctor_id, to_patient_id, subject, content)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        message.fromPatientId ?? null,
        message.toDoctorId ?? null,
        message.fromDoctorId ?? null,
        message.toPatientId ?? null,
        message.subject ?? null,
        message.content,
      ],
    );
    return rows[0];
  }
}
