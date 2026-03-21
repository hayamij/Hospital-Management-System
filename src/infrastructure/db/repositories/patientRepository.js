import { PatientRepositoryPort } from '../../../application/ports/repositories/patientRepositoryPort.js';
import { Patient } from '../../../domain/entities/patient.js';

const toEntity = (row) => {
  if (!row) return null;
  return new Patient({
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    contactInfo: {
      email: row.contact_email,
      phone: row.contact_phone,
      address: row.contact_address,
      emergencyContact: row.emergency_contact,
    },
    status: row.status,
    assignedDoctorId: row.assigned_doctor_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

export class SqlPatientRepository extends PatientRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM patients WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async create(patient) {
    const contact = patient.contactInfo ?? {};
    const { rows } = await this.pool.query(
      `INSERT INTO patients (full_name, date_of_birth, contact_email, contact_phone, contact_address, emergency_contact, status, assigned_doctor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        patient.fullName,
        patient.dateOfBirth ?? null,
        contact.email ?? null,
        contact.phone ?? null,
        contact.address ?? null,
        contact.emergencyContact ?? null,
        patient.status ?? 'active',
        patient.assignedDoctorId ?? null,
      ],
    );
    return toEntity(rows[0]);
  }

  async save(patient) {
    const contact = patient.contactInfo ?? {};
    const { rows } = await this.pool.query(
      `UPDATE patients
         SET full_name = $1,
             date_of_birth = $2,
             contact_email = $3,
             contact_phone = $4,
             contact_address = $5,
             emergency_contact = $6,
             status = $7,
             assigned_doctor_id = $8,
             updated_at = now()
       WHERE id = $9
       RETURNING *`,
      [
        patient.fullName,
        patient.dateOfBirth ?? null,
        contact.email ?? null,
        contact.phone ?? null,
        contact.address ?? null,
        contact.emergencyContact ?? null,
        patient.status ?? 'active',
        patient.assignedDoctorId ?? null,
        patient.id,
      ],
    );
    return toEntity(rows[0]);
  }
}
