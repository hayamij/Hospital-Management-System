import assert from 'node:assert';
import { ManageAppointmentDecisionUseCase } from '../../../../server/application/use-cases/doctor/manageAppointmentDecision.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeAppointment {
  constructor({ id, doctorId }) {
    this.id = id;
    this.doctorId = doctorId;
    this.status = 'pending';
    this.touched = false;
  }
  getDoctorId() {
    return this.doctorId;
  }
  getId() {
    return this.id;
  }
  getStatus() {
    return this.status;
  }
  cancel() {
    this.status = 'cancelled';
  }
  touch() {
    this.touched = true;
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

class FakeAppointmentRepository {
  constructor(items) {
    this.items = items;
    this.saved = null;
  }
  async findById(id) {
    return this.items[id] ?? null;
  }
  async save(appointment) {
    this.saved = appointment;
    this.items[appointment.id] = appointment;
  }
}

const doctor = { id: 'doc-1' };
const appointment = new FakeAppointment({ id: 'appt-1', doctorId: doctor.id });

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
    () => new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ appointmentId: appointment.id, decision: 'accept' }),
    'Doctor id is required.',
  );

  // Missing appointmentId
  await expectThrows(
    () => new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ doctorId: doctor.id, decision: 'accept' }),
    'Appointment id is required.',
  );

  // Invalid decision
  await expectThrows(
    () => new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, decision: 'maybe' }),
    'Invalid decision.',
  );

  // Doctor not found
  await expectThrows(
    () => new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: appointment }) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, decision: 'accept' }),
    'Doctor not found.',
  );

  // Appointment not found
  await expectThrows(
    () => new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, decision: 'accept' }),
    'Appointment not found.',
  );

  // Doctor mismatch
  await expectThrows(
    () => new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: 'other' }) }) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, decision: 'accept' }),
    'Doctor is not assigned to this appointment.',
  );

  // Success accept
  const repoAccept = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: doctor.id }) });
  const acceptResult = await new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: repoAccept }).execute({ doctorId: doctor.id, appointmentId: appointment.id, decision: 'accept' });
  assert.strictEqual(acceptResult.status, 'scheduled');
  assert.strictEqual(repoAccept.saved.getStatus(), 'scheduled');

  // Success reject
  const repoReject = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: doctor.id }) });
  const rejectResult = await new ManageAppointmentDecisionUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: repoReject }).execute({ doctorId: doctor.id, appointmentId: appointment.id, decision: 'reject' });
  assert.strictEqual(rejectResult.status, 'cancelled');
  assert.strictEqual(repoReject.saved.getStatus(), 'cancelled');
  assert.ok(repoReject.saved.touched);
}

wrapLegacyRun(run, 'manageAppointmentDecision.usecase');

