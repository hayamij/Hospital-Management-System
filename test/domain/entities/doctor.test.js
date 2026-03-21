import assert from 'node:assert';
import { Doctor } from '../../../src/domain/entities/doctor.js';
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
  await expectThrows(() => Promise.resolve(new Doctor({ id: 'd1', fullName: ' ', specialization: 'Cardio' })), 'Doctor name is required.');
  await expectThrows(() => Promise.resolve(new Doctor({ id: 'd1', fullName: 'Dr A', specialization: ' ' })), 'Specialization is required.');
  await expectThrows(() => Promise.resolve(new Doctor({ id: 'd1', fullName: 'Dr A', specialization: 'Cardio', availableSlotsPerDay: -1 })), 'Available slots per day cannot be negative.');

  const doc = new Doctor({ id: 'd1', fullName: ' Dr A ', specialization: ' Cardio ', department: ' Heart ', availableSlotsPerDay: 3 });
  assert.strictEqual(doc.getName(), 'Dr A');
  assert.strictEqual(doc.getSpecialization(), 'Cardio');
  assert.strictEqual(doc.getDepartment(), 'Heart');
  assert.strictEqual(doc.getStatus(), 'active');
  assert.strictEqual(doc.getAvailableSlotsPerDay(), 3);

  doc.setAvailability(5);
  assert.strictEqual(doc.getAvailableSlotsPerDay(), 5);
  await expectThrows(() => Promise.resolve(doc.setAvailability(-2)), 'Available slots per day cannot be negative.');

  doc.markOnLeave();
  assert.strictEqual(doc.getStatus(), 'on_leave');
  doc.activate();
  assert.strictEqual(doc.getStatus(), 'active');
  doc.deactivate();
  assert.strictEqual(doc.getStatus(), 'inactive');
}

run()
  .then(() => console.log('doctor tests passed'))
  .catch((err) => {
    console.error('doctor tests failed', err);
    process.exit(1);
  });
