import { ContactLeadRepositoryPort } from '../../../application/ports/repositories/contactLeadRepositoryPort.js';

// SQL repository stub for contact/lead submissions.
export class SqlContactLeadRepository extends ContactLeadRepositoryPort {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async listPending() {
    throw new Error('SqlContactLeadRepository.listPending not implemented');
  }

  async create(lead) {
    throw new Error('SqlContactLeadRepository.create not implemented');
  }
}
