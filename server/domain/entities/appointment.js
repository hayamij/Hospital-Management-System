import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class Appointment extends BaseEntity {
  constructor({
    id,
    patientId,
    doctorId,
    startAt,
    endAt,
    reason,
    status = 'scheduled',
    createdAt,
    updatedAt,
  }) {
    super(id, createdAt, updatedAt);

    if (endAt.getTime() <= startAt.getTime()) {
      throw new DomainError('Appointment end time must be after start time.');
    }

    if (!reason || !reason.trim()) {
      throw new DomainError('Appointment reason is required.');
    }

    this.patientId = patientId;
    this.doctorId = doctorId;
    this.startAt = startAt;
    this.endAt = endAt;
    this.reason = reason.trim();
    this.status = status;
  }

  getPatientId() {
    return this.patientId;
  }

  getDoctorId() {
    return this.doctorId;
  }

  getStartAt() {
    return this.startAt;
  }

  getEndAt() {
    return this.endAt;
  }

  getReason() {
    return this.reason;
  }

  getStatus() {
    return this.status;
  }

  reschedule(startAt, endAt) {
    if (endAt.getTime() <= startAt.getTime()) {
      throw new DomainError('Appointment end time must be after start time.');
    }

    this.startAt = startAt;
    this.endAt = endAt;
    this.status = 'scheduled';
    this.touch();
  }

  markCompleted() {
    this.status = 'completed';
    this.touch();
  }

  cancel() {
    this.status = 'cancelled';
    this.touch();
  }

  markNoShow() {
    this.status = 'no_show';
    this.touch();
  }
}
