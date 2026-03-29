import { ContactLeadRepositoryPort } from '../../application/ports/repositories/contactLeadRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class ContactLeadRepositoryAdapter extends ContactLeadRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async listPending() { return toPlain(await this.inner.listPending()); }
  async create(lead) { return toPlain(await this.inner.create(lead)); }
}
