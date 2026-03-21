import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class Doctor extends BaseEntity {
  constructor({
    id,
    fullName,
    specialization,
    department,
    status = 'active',
    availableSlotsPerDay = 0,
    createdAt,
    updatedAt,
  }) {
    super(id, createdAt, updatedAt);

    if (!fullName || !fullName.trim()) {
      throw new DomainError('Doctor name is required.');
    }

    if (!specialization || !specialization.trim()) {
      throw new DomainError('Specialization is required.');
    }

    if (availableSlotsPerDay < 0) {
      throw new DomainError('Available slots per day cannot be negative.');
    }

    this.fullName = fullName.trim();
    this.specialization = specialization.trim();
    this.department = department?.trim() ?? '';
    this.status = status;
    this.availableSlotsPerDay = availableSlotsPerDay;
  }

  getName() {
    return this.fullName;
  }

  getSpecialization() {
    return this.specialization;
  }

  getDepartment() {
    return this.department;
  }

  getStatus() {
    return this.status;
  }

  getAvailableSlotsPerDay() {
    return this.availableSlotsPerDay;
  }

  setAvailability(slotsPerDay) {
    if (slotsPerDay < 0) {
      throw new DomainError('Available slots per day cannot be negative.');
    }

    this.availableSlotsPerDay = slotsPerDay;
    this.touch();
  }

  markOnLeave() {
    this.status = 'on_leave';
    this.touch();
  }

  activate() {
    this.status = 'active';
    this.touch();
  }

  deactivate() {
    this.status = 'inactive';
    this.touch();
  }
}
