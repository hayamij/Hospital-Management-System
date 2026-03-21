import { MessageRepositoryPort } from '../../application/ports/repositories/messageRepositoryPort.js';
import { toPlain } from './toPlain.js';

export class MessageRepositoryAdapter extends MessageRepositoryPort {
  constructor(inner) { super(); this.inner = inner; }

  async create(message) { return toPlain(await this.inner.create(message)); }
}
