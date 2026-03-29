import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class Patient extends BaseEntity {
  constructor({
    id,
    fullName,
    dateOfBirth,
    contactInfo,
    status = 'active',
    assignedDoctorId,
    createdAt,
    updatedAt,
  }) {
    super(id, createdAt, updatedAt);

    if (!fullName || !fullName.trim()) {
      throw new DomainError('Patient name is required.');
    }

    this.fullName = fullName.trim();
    this.dateOfBirth = dateOfBirth;
    this.contactInfo = contactInfo;
    this.status = status;
    this.assignedDoctorId = assignedDoctorId;
  }

  getName() {
    return this.fullName;
  }

  getDateOfBirth() {
    return this.dateOfBirth;
  }

  getContact() {
    return this.contactInfo;
  }

  getStatus() {
    return this.status;
  }

  getAssignedDoctorId() {
    return this.assignedDoctorId;
  }

  updateContact(contactInfo) {
    this.contactInfo = contactInfo;
    this.touch();
  }

  assignDoctor(doctorId) {
    this.assignedDoctorId = doctorId;
    this.touch();
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
