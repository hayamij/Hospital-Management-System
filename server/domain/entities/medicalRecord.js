import { BaseEntity } from './baseEntity.js';
import { DomainError } from '../exceptions/domainError.js';

export class MedicalRecord extends BaseEntity {
  constructor({ id, patientId, entries = [], createdAt, updatedAt }) {
    super(id, createdAt, updatedAt);

    this.patientId = patientId;
    this.entries = entries;
  }

  getPatientId() {
    return this.patientId;
  }

  getEntries() {
    return [...this.entries];
  }

  addEntry(entry) {
    if (!entry?.note || !entry.note.trim()) {
      throw new DomainError('Medical record entry must include a note.');
    }

    this.entries.push({ ...entry, note: entry.note.trim() });
    this.touch();
  }
}
