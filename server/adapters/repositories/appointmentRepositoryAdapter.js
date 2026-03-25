import { AppointmentRepositoryPort } from '../../application/ports/repositories/appointmentRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class AppointmentRepositoryAdapter extends AppointmentRepositoryPort {
  constructor(inner) {
    super();
    this.inner = inner;
  }

  async findById(id) {
    return toPlain(await this.inner.findById(id));
  }

  async save(appointment) {
    return toPlain(await this.inner.save(appointment));
  }

  async listByDoctor(doctorId, filters) {
    return toPlain(await this.inner.listByDoctor(doctorId, filters));
  }

  async listByPatient(patientId) {
    return toPlain(await this.inner.listByPatient(patientId));
  }

  async listAvailableSlots(doctorId, filters) {
    return toPlain(await this.inner.listAvailableSlots(doctorId, filters));
  }
}
