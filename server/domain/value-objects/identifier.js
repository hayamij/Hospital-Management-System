import { DomainError } from '../exceptions/domainError.js';

export class Identifier {
  constructor(value) {
    if (!value || !String(value).trim()) {
      throw new DomainError('Identifier cannot be empty.');
    }

    this.value = String(value).trim();
  }

  toString() {
    return this.value;
  }

  equals(other) {
    return this.value === other.value;
  }
}
