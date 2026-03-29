import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class Billing extends BaseEntity {
  constructor({
    id,
    invoiceNumber,
    patientId,
    charges,
    status = 'draft',
    dueDate,
    createdAt,
    updatedAt,
  }) {
    super(id, createdAt, updatedAt);

    if (!invoiceNumber || !invoiceNumber.trim()) {
      throw new DomainError('Invoice number is required.');
    }

    if (!Array.isArray(charges) || !charges.length) {
      throw new DomainError('Billing must contain at least one charge line.');
    }

    if (charges.some((line) => line.amount < 0)) {
      throw new DomainError('Charge amounts cannot be negative.');
    }

    this.invoiceNumber = invoiceNumber.trim();
    this.patientId = patientId;
    this.charges = charges.map((line) => ({ ...line, description: line.description.trim() }));
    this.status = status;
    this.dueDate = dueDate;
  }

  getInvoiceNumber() {
    return this.invoiceNumber;
  }

  getPatientId() {
    return this.patientId;
  }

  getCharges() {
    return [...this.charges];
  }

  getStatus() {
    return this.status;
  }

  getDueDate() {
    return this.dueDate;
  }

  calculateTotal() {
    return this.charges.reduce((sum, line) => sum + line.amount, 0);
  }

  issue(dueDate) {
    if (dueDate.getTime() < this.getCreatedAt().getTime()) {
      throw new DomainError('Due date cannot be before invoice creation.');
    }

    this.status = 'issued';
    this.dueDate = dueDate;
    this.touch();
  }

  markPaid() {
    if (this.status === 'void') {
      throw new DomainError('Cannot pay a void invoice.');
    }

    this.status = 'paid';
    this.touch();
  }

  void() {
    if (this.status === 'paid') {
      throw new DomainError('Cannot void a paid invoice.');
    }

    this.status = 'void';
    this.touch();
  }
}
