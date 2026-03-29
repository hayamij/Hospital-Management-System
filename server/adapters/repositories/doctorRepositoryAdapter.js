import { DoctorRepositoryPort } from '../../application/ports/repositories/doctorRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class DoctorRepositoryAdapter extends DoctorRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async findById(id) { return toPlain(await this.inner.findById(id)); }

  async save(doctor) { return toPlain(await this.inner.save(doctor)); }

  async search(filters) { return toPlain(await this.inner.search(filters)); }
}
