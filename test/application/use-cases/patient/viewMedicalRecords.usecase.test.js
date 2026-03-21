import assert from 'node:assert';
import { ViewMedicalRecordsUseCase } from '../../../../src/application/use-cases/patient/viewMedicalRecords.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; }
  async findById(id) { return this.patients[id] ?? null; }
}

class FakeMedicalRecordRepository {
  constructor(records) { this.records = records; this.lastQuery = null; }
  async findByPatientId(patientId) {
    this.lastQuery = { patientId };
    return this.records[patientId] ?? [];
  }
}

async function expectThrows(fn, message) {
  let threw = false;
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

const patient = { id: 'pat-1' };
const records = [
  { id: 'r1', type: 'lab', date: new Date('2025-03-01') },
  { id: 'r2', type: 'imaging', date: new Date('2025-04-01') },
];

async function run() {
  await expectThrows(() => new ViewMedicalRecordsUseCase({ patientRepository: new FakePatientRepository({}) }).execute({}), 'Patient id is required.');
  await expectThrows(() => new ViewMedicalRecordsUseCase({ patientRepository: new FakePatientRepository({}) }).execute({ patientId: patient.id }), 'Patient not found.');

  const repo = new FakeMedicalRecordRepository({ [patient.id]: records });
  const result = await new ViewMedicalRecordsUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), medicalRecordRepository: repo }).execute({ patientId: patient.id, page: 1, pageSize: 10 });
  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.records[0].id, 'r1');
  assert.strictEqual(repo.lastQuery.patientId, patient.id);
}

run()
  .then(() => console.log('viewMedicalRecords.usecase tests passed'))
  .catch((err) => {
    console.error('viewMedicalRecords.usecase tests failed', err);
    process.exit(1);
  });
