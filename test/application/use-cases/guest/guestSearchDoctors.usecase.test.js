import assert from 'node:assert';
import { GuestSearchDoctorsUseCase } from '../../../../src/application/use-cases/guest/guestSearchDoctors.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeDoctorRepository {
  constructor(results) {
    this.results = results;
    this.lastQuery = null;
  }
  async search(query) {
    this.lastQuery = query;
    return this.results;
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
  // Name not string
  await expectThrows(
    () => new GuestSearchDoctorsUseCase({ doctorRepository: new FakeDoctorRepository([]) }).execute({ name: 123 }),
    'Name filter must be a string.',
  );

  // Specialization not string
  await expectThrows(
    () => new GuestSearchDoctorsUseCase({ doctorRepository: new FakeDoctorRepository([]) }).execute({ specialization: 123 }),
    'Specialization filter must be a string.',
  );

  // Success with trim and default empty list
  const repo = new FakeDoctorRepository([{ id: 'doc-1', name: 'Alice' }]);
  const result = await new GuestSearchDoctorsUseCase({ doctorRepository: repo }).execute({ name: ' Alice ', specialization: ' Cardio ' });
  assert.deepStrictEqual(result.doctors, [{ id: 'doc-1', name: 'Alice' }]);
  assert.deepStrictEqual(repo.lastQuery, { name: 'Alice', specialization: 'Cardio' });

  // Success with null results
  const repoNull = new FakeDoctorRepository(null);
  const resultNull = await new GuestSearchDoctorsUseCase({ doctorRepository: repoNull }).execute({});
  assert.deepStrictEqual(resultNull.doctors, []);
}

run()
  .then(() => console.log('guestSearchDoctors.usecase tests passed'))
  .catch((err) => {
    console.error('guestSearchDoctors.usecase tests failed', err);
    process.exit(1);
  });
