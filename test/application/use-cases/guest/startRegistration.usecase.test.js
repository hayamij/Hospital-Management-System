import assert from 'node:assert';
import { StartRegistrationUseCase } from '../../../../src/application/use-cases/guest/startRegistration.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(created) {
    this.created = created;
    this.lastPayload = null;
  }
  async create(patient) {
    this.lastPayload = patient;
    return this.created ?? { id: 'pat-1', ...patient };
  }
}

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
  // Missing full name
  await expectThrows(
    () => new StartRegistrationUseCase({ patientRepository: new FakePatientRepository() }).execute({ email: 'a@b.com', phone: '123' }),
    'Full name is required.',
  );

  // Missing email
  await expectThrows(
    () => new StartRegistrationUseCase({ patientRepository: new FakePatientRepository() }).execute({ fullName: 'A', phone: '123' }),
    'Email is required.',
  );

  // Missing phone
  await expectThrows(
    () => new StartRegistrationUseCase({ patientRepository: new FakePatientRepository() }).execute({ fullName: 'A', email: 'a@b.com' }),
    'Phone is required.',
  );

  // Success with default created object
  const repo = new FakePatientRepository();
  const result = await new StartRegistrationUseCase({ patientRepository: repo }).execute({ fullName: ' Guest ', email: ' guest@example.com ', phone: ' 123456 ' });
  assert.strictEqual(result.status, 'pending');
  assert.ok(result.patientId);
  assert.strictEqual(repo.lastPayload.fullName, 'Guest');
  assert.strictEqual(repo.lastPayload.contactInfo.email, 'guest@example.com');
  assert.strictEqual(repo.lastPayload.contactInfo.phone, '123456');
  assert.strictEqual(repo.lastPayload.status, 'pending');
  assert.ok(repo.lastPayload.createdAt instanceof Date);

  // Success with repository returning primitive id
  const repoId = new FakePatientRepository('pat-42');
  const resultId = await new StartRegistrationUseCase({ patientRepository: repoId }).execute({ fullName: 'B', email: 'b@c.com', phone: '999' });
  assert.strictEqual(resultId.patientId, 'pat-42');
}

wrapLegacyRun(run, 'startRegistration.usecase');

