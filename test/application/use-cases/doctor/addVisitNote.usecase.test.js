import assert from 'node:assert';
import { AddVisitNoteUseCase } from '../../../../server/application/use-cases/doctor/addVisitNote.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeMedicalRecord {
  constructor(patientId) {
    this.patientId = patientId;
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

class FakePatientRepository {
  constructor(patients) {
    this.patients = patients;
  }
  async findById(id) {
    return this.patients[id] ?? null;
  }
}

class FakeMedicalRecordRepository {
  constructor(records) {
    this.records = records;
    this.saved = null;
  }
  async findByPatientId(patientId) {
    return this.records[patientId] ?? null;
  }
  async save(record) {
    this.saved = record;
    this.records[record.patientId] = record;
  }
}

const doctor = { id: 'doc-1' };
const patient = { id: 'pat-1' };
const record = new FakeMedicalRecord(patient.id);

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
    () => new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({}), patientRepository: new FakePatientRepository({}), medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ patientId: patient.id, note: 'hello' }),
    'Doctor id is required.',
  );

  // Missing patientId
  await expectThrows(
    () => new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), patientRepository: new FakePatientRepository({}), medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ doctorId: doctor.id, note: 'hello' }),
    'Patient id is required.',
  );

  // Missing note
  await expectThrows(
    () => new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), patientRepository: new FakePatientRepository({ [patient.id]: patient }), medicalRecordRepository: new FakeMedicalRecordRepository({ [patient.id]: record }) }).execute({ doctorId: doctor.id, patientId: patient.id }),
    'Visit note is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({}), patientRepository: new FakePatientRepository({ [patient.id]: patient }), medicalRecordRepository: new FakeMedicalRecordRepository({ [patient.id]: record }) }).execute({ doctorId: doctor.id, patientId: patient.id, note: 'hello' }),
    'Doctor not found.',
  );

  // Patient not found
  await expectThrows(
    () => new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), patientRepository: new FakePatientRepository({}), medicalRecordRepository: new FakeMedicalRecordRepository({ [patient.id]: record }) }).execute({ doctorId: doctor.id, patientId: patient.id, note: 'hello' }),
    'Patient not found.',
  );

  // Record missing
  await expectThrows(
    () => new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), patientRepository: new FakePatientRepository({ [patient.id]: patient }), medicalRecordRepository: new FakeMedicalRecordRepository({}) }).execute({ doctorId: doctor.id, patientId: patient.id, note: 'hello' }),
    'Medical record not found for patient.',
  );

  // Success
  const medRepo = new FakeMedicalRecordRepository({ [patient.id]: new FakeMedicalRecord(patient.id) });
  const result = await new AddVisitNoteUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), patientRepository: new FakePatientRepository({ [patient.id]: patient }), medicalRecordRepository: medRepo }).execute({ doctorId: doctor.id, patientId: patient.id, note: 'Follow up needed' });
  assert.strictEqual(result.patientId, patient.id);
  assert.strictEqual(result.entryCount, 1);
  assert.strictEqual(medRepo.saved.getEntries().length, 1);
  assert.strictEqual(medRepo.saved.getEntries()[0].authorDoctorId, doctor.id);
}

wrapLegacyRun(run, 'addVisitNote.usecase');

