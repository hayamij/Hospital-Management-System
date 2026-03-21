import { PrescriptionRepositoryPort } from '../../../application/ports/repositories/prescriptionRepositoryPort.js';

export class SqlPrescriptionRepository extends PrescriptionRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM prescriptions WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ?? null;
  }

  async listByPatient(patientId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC',
      [patientId],
    );
    return rows;
  }
}
