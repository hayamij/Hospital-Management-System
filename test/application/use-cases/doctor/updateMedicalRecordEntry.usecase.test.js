import assert from 'node:assert';
import { UpdateMedicalRecordEntryUseCase } from '../../../../server/application/use-cases/doctor/updateMedicalRecordEntry.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeMedicalRecord {
  constructor(id) {
    this.id = id;
    this.entries = [];
  }
  addEntry(entry) {
    this.entries.push(entry);
  }
  getEntries() {
    return this.entries;
  }
}

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakeMedicalRecordRepository {
  constructor(records) {
    this.records = records;
    this.saved = null;
  }
  async findById(id) {
    return this.records[id] ?? null;
  }
  async save(record) {
    this.saved = record;
    this.records[record.id] = record;
  }
}

const doctor = { id: 'doc-1' };
const record = new FakeMedicalRecord('rec-1');

async function expectThrows(fn, message) {
  let threw = false;
  try {
    await fn();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) {
      assert.strictEqual(err.message, message);
    }
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  // Missing doctorId
  await expectThrows(
    () => new UpdateMedicalRecordEntryUseCase({ doctorRepository: new FakeDoctorRepository({}), medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ recordId: record.id, note: 'note' }),
    'Doctor id is required.',
  );

  // Missing recordId
  await expectThrows(
    () => new UpdateMedicalRecordEntryUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ doctorId: doctor.id, note: 'note' }),
    'Record id is required.',
  );

  // Missing note
  await expectThrows(
    () => new UpdateMedicalRecordEntryUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), medicalRecordRepository: new FakeMedicalRecordRepository({ [record.id]: record }) }).execute({ doctorId: doctor.id, recordId: record.id }),
    'Note is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new UpdateMedicalRecordEntryUseCase({ doctorRepository: new FakeDoctorRepository({}), medicalRecordRepository: new FakeMedicalRecordRepository({ [record.id]: record }) }).execute({ doctorId: doctor.id, recordId: record.id, note: 'note' }),
    'Doctor not found.',
  );

  // Record not found
  await expectThrows(
    () => new UpdateMedicalRecordEntryUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ doctorId: doctor.id, recordId: record.id, note: 'note' }),
    'Medical record not found.',
  );

  // Success
  const repo = new FakeMedicalRecordRepository({ [record.id]: new FakeMedicalRecord(record.id) });
  const result = await new UpdateMedicalRecordEntryUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), medicalRecordRepository: repo }).execute({ doctorId: doctor.id, recordId: record.id, note: 'Follow up' });
  assert.strictEqual(result.recordId, record.id);
  assert.strictEqual(result.entryCount, 1);
  assert.strictEqual(repo.saved.getEntries().length, 1);
  assert.strictEqual(repo.saved.getEntries()[0].authorDoctorId, doctor.id);
}

wrapLegacyRun(run, 'updateMedicalRecordEntry.usecase');

