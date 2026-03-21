import assert from 'node:assert';
import { SearchDoctorsUseCase } from '../../../../src/application/use-cases/patient/searchDoctors.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

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
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  await expectThrows(
    () => new SearchDoctorsUseCase({ doctorRepository: new FakeDoctorRepository([]) }).execute({ page: -1, pageSize: 10 }),
    'Invalid pagination parameters.',
  );

  const repo = new FakeDoctorRepository([
    { id: 'd1', status: 'active' },
    { id: 'd2', status: 'active' },
    { id: 'd3', status: 'active' },
  ]);
  const result = await new SearchDoctorsUseCase({ doctorRepository: repo }).execute({ query: ' Alice ', specialty: ' Cardio ', page: 2, pageSize: 1 });
  assert.strictEqual(result.page, 2);
  assert.strictEqual(result.pageSize, 1);
  assert.strictEqual(result.total, 3);
  assert.deepStrictEqual(result.doctors, [{ id: 'd2', status: 'active' }]);
  assert.deepStrictEqual(repo.lastQuery, { name: 'Alice', specialization: 'Cardio' });
}

wrapLegacyRun(run, 'searchDoctors.usecase');

