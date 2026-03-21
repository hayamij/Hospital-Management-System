import { DomainError } from '../exceptions/domainError.js';

export class BaseEntity {
  constructor(id, createdAt, updatedAt) {
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? this.createdAt;

    if (this.updatedAt.getTime() < this.createdAt.getTime()) {
      throw new DomainError('updatedAt cannot be earlier than createdAt.');
    }
  }

  getId() {
    return this.id;
  }

  getCreatedAt() {
    return this.createdAt;
  }

  getUpdatedAt() {
    return this.updatedAt;
  }

  touch() {
    this.updatedAt = new Date();
  }
}
