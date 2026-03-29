import { UserRepositoryPort } from '../../application/ports/repositories/userRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class UserRepositoryAdapter extends UserRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async findById(id) { return toPlain(await this.inner.findById(id)); }
  async findByEmail(email) { return toPlain(await this.inner.findByEmail(email)); }
  async save(user) { return toPlain(await this.inner.save(user)); }
}
