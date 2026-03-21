import assert from 'node:assert';
import { UpdatePatientProfileUseCase } from '../../../../src/application/use-cases/patient/updatePatientProfile.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; this.saved = null; }
  async findById(id) { return this.patients[id] ?? null; }
  async save(patient) { this.saved = patient; return patient; }
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

const patient = { id: 'pat-1', name: 'John Doe', age: 30 };

async function run() {
  await expectThrows(() => new UpdatePatientProfileUseCase({ patientRepository: new FakePatientRepository({}) }).execute({ updates: { name: 'New' } }), 'Patient id is required.');
  await expectThrows(() => new UpdatePatientProfileUseCase({ patientRepository: new FakePatientRepository({}) }).execute({ patientId: patient.id, dateOfBirth: 'bad-date' }), 'Patient not found.');

  await expectThrows(() => new UpdatePatientProfileUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }) }).execute({ patientId: patient.id, dateOfBirth: 'bad-date' }), 'Invalid date of birth.');

  const repo = new FakePatientRepository({ [patient.id]: { ...patient } });
  const result = await new UpdatePatientProfileUseCase({ patientRepository: repo }).execute({ patientId: patient.id, name: 'Jane Doe', phone: '123', address: '123 Street' });
  assert.strictEqual(result.patientId, patient.id);
  assert.ok(repo.saved);
  assert.strictEqual(repo.saved.fullName, 'Jane Doe');
  assert.strictEqual(repo.saved.contactInfo.phone, '123');
  assert.strictEqual(repo.saved.contactInfo.address, '123 Street');
}

run()
  .then(() => console.log('updatePatientProfile.usecase tests passed'))
  .catch((err) => {
    console.error('updatePatientProfile.usecase tests failed', err);
    process.exit(1);
  });
