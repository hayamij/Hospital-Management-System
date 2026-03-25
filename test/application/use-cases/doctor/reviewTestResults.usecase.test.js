import assert from 'node:assert';
import { ReviewTestResultsUseCase } from '../../../../server/application/use-cases/doctor/reviewTestResults.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakeLabResultRepository {
  constructor(results) {
    this.results = results;
    this.saved = null;
  }
  async findById(id) {
    return this.results[id] ?? null;
  }
  async save(result) {
    this.saved = result;
    this.results[result.id] = result;
  }
}

const doctor = { id: 'doc-1' };
const labResult = { id: 'lab-1' };

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
    () => new ReviewTestResultsUseCase({ doctorRepository: new FakeDoctorRepository({}), labResultRepository: new FakeLabResultRepository({}) }).execute({ labResultId: labResult.id }),
    'Doctor id is required.',
  );

  // Missing labResultId
  await expectThrows(
    () => new ReviewTestResultsUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), labResultRepository: new FakeLabResultRepository({}) }).execute({ doctorId: doctor.id }),
    'Lab result id is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new ReviewTestResultsUseCase({ doctorRepository: new FakeDoctorRepository({}), labResultRepository: new FakeLabResultRepository({ [labResult.id]: labResult }) }).execute({ doctorId: doctor.id, labResultId: labResult.id }),
    'Doctor not found.',
  );

  // Lab result not found
  await expectThrows(
    () => new ReviewTestResultsUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), labResultRepository: new FakeLabResultRepository({}) }).execute({ doctorId: doctor.id, labResultId: labResult.id }),
    'Lab result not found.',
  );

  // Success with notes
  const repo = new FakeLabResultRepository({ [labResult.id]: { ...labResult } });
  const result = await new ReviewTestResultsUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), labResultRepository: repo }).execute({ doctorId: doctor.id, labResultId: labResult.id, notes: 'All good' });
  assert.strictEqual(result.labResultId, labResult.id);
  assert.strictEqual(result.reviewed, true);
  assert.ok(result.reviewedAt instanceof Date);
  assert.strictEqual(repo.saved.reviewedBy, doctor.id);
  assert.strictEqual(repo.saved.notes, 'All good');
}

wrapLegacyRun(run, 'reviewTestResults.usecase');

