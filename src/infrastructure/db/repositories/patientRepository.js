import crypto from 'node:crypto';
import { PatientRepositoryPort } from '../../../application/ports/repositories/patientRepositoryPort.js';
import { Patient } from '../../../domain/entities/patient.js';

const ensureId = (id) => id || crypto.randomUUID();
const toDate = (value) => (value ? new Date(value) : null);

const toEntity = (row) => {
  if (!row) return null;
  return new Patient({
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
    contactInfo: {
      email: row.contact_email,
      phone: row.contact_phone,
      address: row.contact_address,
      emergencyContact: typeof row.emergency_contact === 'string' ? JSON.parse(row.emergency_contact) : row.emergency_contact,
    },
    status: row.status,
    assignedDoctorId: row.assigned_doctor_id,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
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
    const id = ensureId(patient.id);
    const emergency = contact.emergencyContact ? JSON.stringify(contact.emergencyContact) : null;
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : null;

    await this.pool.query(
      `INSERT INTO patients (id, full_name, date_of_birth, contact_email, contact_phone, contact_address, emergency_contact, status, assigned_doctor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        patient.fullName,
        dob,
        contact.email ?? null,
        contact.phone ?? null,
        contact.address ?? null,
        emergency,
        patient.status ?? 'active',
        patient.assignedDoctorId ?? null,
      ],
    );
    return this.findById(id);
  }

  async save(patient) {
    const contact = patient.contactInfo ?? {};
    const emergency = contact.emergencyContact ? JSON.stringify(contact.emergencyContact) : null;
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : null;

    await this.pool.query(
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
       WHERE id = $9`,
      [
        patient.fullName,
        dob,
        contact.email ?? null,
        contact.phone ?? null,
        contact.address ?? null,
        emergency,
        patient.status ?? 'active',
        patient.assignedDoctorId ?? null,
        patient.id,
      ],
    );
    return this.findById(patient.id);
  }
}
