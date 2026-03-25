import assert from 'node:assert';
import { Patient } from '../../../server/domain/entities/patient.js';
import { DomainError } from '../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

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
  await expectThrows(() => Promise.resolve(new Patient({ id: 'p1', fullName: ' ', dateOfBirth: new Date('2000-01-01') })), 'Patient name is required.');

  const patient = new Patient({ id: 'p1', fullName: ' John Doe ', dateOfBirth: new Date('2000-01-01'), contactInfo: { phone: '123' }, assignedDoctorId: 'd1' });
  assert.strictEqual(patient.getName(), 'John Doe');
  assert.strictEqual(patient.getAssignedDoctorId(), 'd1');
  assert.strictEqual(patient.getStatus(), 'active');

  patient.updateContact({ phone: '456', address: 'Street' });
  assert.deepStrictEqual(patient.getContact(), { phone: '456', address: 'Street' });

  patient.assignDoctor('d2');
  assert.strictEqual(patient.getAssignedDoctorId(), 'd2');

  patient.deactivate();
  assert.strictEqual(patient.getStatus(), 'inactive');
  patient.activate();
  assert.strictEqual(patient.getStatus(), 'active');
}

wrapLegacyRun(run, 'patient');

