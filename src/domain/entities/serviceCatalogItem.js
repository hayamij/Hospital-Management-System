import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class ServiceCatalogItem extends BaseEntity {
  constructor({ id, name, price = 0, description = '', createdAt, updatedAt }) {
    super(id, createdAt, updatedAt);

    if (!name || !name.trim()) {
      throw new DomainError('Service name is required.');
    }
    if (typeof price !== 'number' || Number.isNaN(price) || price < 0) {
      throw new DomainError('Service price must be a non-negative number.');
    }

    this.name = name.trim();
    this.price = price;
    this.description = description || '';
  }
}