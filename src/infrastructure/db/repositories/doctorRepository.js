import crypto from 'node:crypto';
import { DoctorRepositoryPort } from '../../../application/ports/repositories/doctorRepositoryPort.js';
import { Doctor } from '../../../domain/entities/doctor.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return new Doctor({
    id: row.id,
    fullName: row.full_name,
    specialization: row.specialization,
    department: row.department,
    availableSlotsPerDay: row.available_slots_per_day ?? 0,
    contactInfo: { email: row.contact_email, phone: row.contact_phone },
    status: row.status,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  });
};

export class SqlDoctorRepository extends DoctorRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM doctors WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async save(doctor) {
    const id = ensureId(doctor.id);
    const updatePayload = [
      doctor.fullName,
      doctor.specialization,
      doctor.department ?? '',
      doctor.availableSlotsPerDay ?? 0,
      doctor.contactInfo?.email ?? null,
      doctor.contactInfo?.phone ?? null,
      doctor.status,
      id,
    ];

    const existing = await this.findById(id);
    if (existing) {
      await this.pool.query(
        `UPDATE doctors
         SET full_name = $1,
             specialization = $2,
             department = $3,
             available_slots_per_day = $4,
             contact_email = $5,
             contact_phone = $6,
             status = $7,
             updated_at = now()
       WHERE id = $8`,
        updatePayload,
      );
      return this.findById(id);
    }

    await this.pool.query(
      `INSERT INTO doctors (id, full_name, specialization, department, available_slots_per_day, contact_email, contact_phone, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        id,
        doctor.fullName,
        doctor.specialization,
        doctor.department ?? '',
        doctor.availableSlotsPerDay ?? 0,
        doctor.contactInfo?.email ?? null,
        doctor.contactInfo?.phone ?? null,
        doctor.status,
      ],
    );
    return this.findById(id);
  }

  async search({ name, specialization } = {}) {
    const conditions = [];
    const values = [];
    if (name) {
      values.push(`%${name}%`);
      conditions.push(`LOWER(full_name) LIKE LOWER($${values.length})`);
    }
    if (specialization) {
      values.push(`%${specialization}%`);
      conditions.push(`LOWER(specialization) LIKE LOWER($${values.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM doctors ${where} ORDER BY full_name ASC`;
    const { rows } = await this.pool.query(query, values);
    return rows.map(toEntity);
  }
}
