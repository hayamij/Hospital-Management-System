import assert from 'node:assert';
import { Appointment } from '../../../server/domain/entities/appointment.js';
import { DomainError } from '../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

async function expectThrows(fn, message) {
  let threw = false;
  try {
    await fn();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError);
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

async function run() {
  const startAt = new Date('2025-01-01T10:00:00Z');
  const endAt = new Date('2025-01-01T11:00:00Z');

  await expectThrows(() => Promise.resolve(new Appointment({ id: 'a1', patientId: 'p1', doctorId: 'd1', startAt, endAt: startAt, reason: ' ' })), 'Appointment end time must be after start time.');
  await expectThrows(() => Promise.resolve(new Appointment({ id: 'a1', patientId: 'p1', doctorId: 'd1', startAt, endAt, reason: ' ' })), 'Appointment reason is required.');

  const appt = new Appointment({ id: 'a1', patientId: 'p1', doctorId: 'd1', startAt, endAt, reason: ' Check ' });
  assert.strictEqual(appt.getId(), 'a1');
  assert.strictEqual(appt.getPatientId(), 'p1');
  assert.strictEqual(appt.getDoctorId(), 'd1');
  assert.strictEqual(appt.getReason(), 'Check');
  assert.strictEqual(appt.getStatus(), 'scheduled');

  appt.reschedule(new Date('2025-01-02T08:00:00Z'), new Date('2025-01-02T09:00:00Z'));
  assert.strictEqual(appt.getStatus(), 'scheduled');

  appt.markCompleted();
  assert.strictEqual(appt.getStatus(), 'completed');

  appt.cancel();
  assert.strictEqual(appt.getStatus(), 'cancelled');

  appt.markNoShow();
  assert.strictEqual(appt.getStatus(), 'no_show');
}

wrapLegacyRun(run, 'appointment');

