import assert from 'node:assert';
import { OverrideAppointmentUseCase } from '../../../../server/application/use-cases/admin/overrideAppointment.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeAppointment {
  constructor({ id, status = 'scheduled', startAt = new Date('2025-01-01T10:00:00Z'), endAt = new Date('2025-01-01T11:00:00Z'), doctorId = 'doc-1' }) {
    this.id = id;
    this.status = status;
    this.startAt = startAt;
    this.endAt = endAt;
    this.doctorId = doctorId;
    this.touched = false;
  }
  getStatus() {
    return this.status;
  }
  getStartAt() {
    return this.startAt;
  }
  getEndAt() {
    return this.endAt;
  }
  getDoctorId() {
    return this.doctorId;
  }
  reschedule(startAt, endAt) {
    this.startAt = startAt;
    this.endAt = endAt;
    this.status = 'rescheduled';
  }
  cancel() {
    this.status = 'cancelled';
  }
  touch() {
    this.touched = true;
  }
}

class FakeAppointmentRepository {
  constructor(items) {
    this.items = items;
    this.saved = null;
  }
  async findById(id) {
    return this.items[id] ?? null;
  }
  async save(app) {
    this.saved = app;
    this.items[app.id] = app;
  }
}

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakeUserRepository {
  constructor(users) {
    this.users = users;
  }
  async findById(id) {
    return this.users[id] ?? null;
  }
}

const admin = { id: 'admin-1', role: 'admin' };
const appointment = new FakeAppointment({ id: 'appt-1' });
const doctor = { id: 'doc-2' };

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
  const baseDeps = {
    appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: appointment }),
    doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
    userRepository: new FakeUserRepository({ [admin.id]: admin }),
  };

  // Missing adminId
  await expectThrows(
    () => new OverrideAppointmentUseCase(baseDeps).execute({ appointmentId: appointment.id, action: 'cancel' }),
    'Admin id is required.',
  );

  // Missing appointmentId
  await expectThrows(
    () => new OverrideAppointmentUseCase(baseDeps).execute({ adminId: admin.id, action: 'cancel' }),
    'Appointment id is required.',
  );

  // Invalid action
  await expectThrows(
    () => new OverrideAppointmentUseCase(baseDeps).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'move' }),
    'Invalid appointment override action.',
  );

  // Non-admin user
  await expectThrows(
    () => new OverrideAppointmentUseCase({ ...baseDeps, userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'patient' } }) }).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'cancel' }),
    'Access denied. Admin role required.',
  );

  // Appointment not found
  await expectThrows(
    () => new OverrideAppointmentUseCase({ ...baseDeps, appointmentRepository: new FakeAppointmentRepository({}) }).execute({ adminId: admin.id, appointmentId: 'missing', action: 'cancel' }),
    'Appointment not found.',
  );

  // Reschedule invalid dates
  await expectThrows(
    () => new OverrideAppointmentUseCase(baseDeps).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'reschedule', startAt: 'bad', endAt: 'also-bad' }),
    'Valid start and end times are required to reschedule.',
  );

  // Success reschedule
  const repoReschedule = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id }) });
  const rescheduleResult = await new OverrideAppointmentUseCase({ ...baseDeps, appointmentRepository: repoReschedule }).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'reschedule', startAt: '2025-02-01T09:00:00Z', endAt: '2025-02-01T10:00:00Z' });
  assert.strictEqual(rescheduleResult.status, 'rescheduled');
  assert.ok(rescheduleResult.startAt instanceof Date);
  assert.ok(rescheduleResult.endAt instanceof Date);
  assert.strictEqual(repoReschedule.saved.getStatus(), 'rescheduled');

  // Success cancel
  const repoCancel = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id }) });
  const cancelResult = await new OverrideAppointmentUseCase({ ...baseDeps, appointmentRepository: repoCancel }).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'cancel' });
  assert.strictEqual(cancelResult.status, 'cancelled');
  assert.strictEqual(repoCancel.saved.getStatus(), 'cancelled');

  // Assign doctor missing id
  await expectThrows(
    () => new OverrideAppointmentUseCase(baseDeps).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'assignDoctor' }),
    'Doctor id is required to assign.',
  );

  // Assign doctor not found
  await expectThrows(
    () => new OverrideAppointmentUseCase({ ...baseDeps, doctorRepository: new FakeDoctorRepository({}) }).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'assignDoctor', doctorId: 'missing' }),
    'Doctor not found.',
  );

  // Success assign doctor
  const repoAssign = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id }) });
  const assignResult = await new OverrideAppointmentUseCase({ ...baseDeps, appointmentRepository: repoAssign }).execute({ adminId: admin.id, appointmentId: appointment.id, action: 'assignDoctor', doctorId: doctor.id });
  assert.strictEqual(assignResult.status, 'scheduled');
  assert.strictEqual(assignResult.doctorId, doctor.id);
  assert.strictEqual(repoAssign.saved.getDoctorId(), doctor.id);
  assert.ok(repoAssign.saved.touched);
}

wrapLegacyRun(run, 'overrideAppointment.usecase');

