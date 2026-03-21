import { UserRepositoryPort } from '../../../application/ports/repositories/userRepositoryPort.js';

const toEntity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    fullName: row.full_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export class SqlUserRepository extends UserRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    return toEntity(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async save(user) {
    if (user.id) {
      const { rows } = await this.pool.query(
        `UPDATE users
           SET email = $1,
               password_hash = $2,
               role = $3,
               status = $4,
               patient_id = $5,
               doctor_id = $6,
               full_name = $7,
               updated_at = now()
         WHERE id = $8
         RETURNING *`,
        [user.email, user.passwordHash, user.role, user.status ?? 'active', user.patientId ?? null, user.doctorId ?? null, user.fullName ?? null, user.id],
      );
      return toEntity(rows[0]);
    }

    const { rows } = await this.pool.query(
      `INSERT INTO users (email, password_hash, role, status, patient_id, doctor_id, full_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [user.email, user.passwordHash, user.role, user.status ?? 'active', user.patientId ?? null, user.doctorId ?? null, user.fullName ?? null],
    );
    return toEntity(rows[0]);
  }
}
