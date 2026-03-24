import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class InsurancePlan extends BaseEntity {
  constructor({ id, name, provider, coveragePercent = 0, status = 'active', createdAt, updatedAt }) {
    super(id, createdAt, updatedAt);

    if (!name || !name.trim()) {
      throw new DomainError('Insurance plan name is required.');
    }

    if (!provider || !provider.trim()) {
      throw new DomainError('Insurance provider is required.');
    }

    if (coveragePercent < 0 || coveragePercent > 100) {
      throw new DomainError('Coverage percent must be between 0 and 100.');
    }

    this.name = name.trim();
    this.provider = provider.trim();
    this.coveragePercent = Number(coveragePercent);
    this.status = status;
  }

  deactivate() {
    this.status = 'inactive';
    this.touch();
  }

  activate() {
    this.status = 'active';
    this.touch();
  }
}