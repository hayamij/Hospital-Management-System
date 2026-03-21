import assert from 'node:assert';
import { MedicalRecord } from '../../../src/domain/entities/medicalRecord.js';
import { DomainError } from '../../../src/domain/exceptions/domainError.js';

async function expectThrows(fn, message) {
  let threw = false;
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError);
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  const rec = new MedicalRecord({ id: 'm1', patientId: 'p1', entries: [{ note: 'Initial' }] });
  assert.strictEqual(rec.getPatientId(), 'p1');
  assert.strictEqual(rec.getEntries().length, 1);

  await expectThrows(() => Promise.resolve(rec.addEntry({ note: ' ' })), 'Medical record entry must include a note.');

  rec.addEntry({ note: ' Follow up ' });
  assert.strictEqual(rec.getEntries().length, 2);
  assert.strictEqual(rec.getEntries()[1].note, 'Follow up');
}

run()
  .then(() => console.log('medicalRecord tests passed'))
  .catch((err) => {
    console.error('medicalRecord tests failed', err);
    process.exit(1);
  });
