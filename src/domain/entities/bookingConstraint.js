import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class BookingConstraint extends BaseEntity {
  constructor({ id, code, description, value, isEnabled = true, createdAt, updatedAt }) {
    super(id, createdAt, updatedAt);

    if (!code || !code.trim()) {
      throw new DomainError('Booking constraint code is required.');
    }

    if (!description || !description.trim()) {
      throw new DomainError('Booking constraint description is required.');
    }

    this.code = code.trim();
    this.description = description.trim();
    this.value = value;
    this.isEnabled = Boolean(isEnabled);
  }

  setEnabled(enabled) {
    this.isEnabled = Boolean(enabled);
    this.touch();
  }
}