import assert from 'node:assert';
import { ScheduleAppointmentUseCase } from '../../../../src/application/use-cases/patient/scheduleAppointment.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; }
  async findById(id) { return this.patients[id] ?? null; }
}

class FakeDoctorRepository {
  constructor(doctors) { this.doctors = doctors; }
  async findById(id) { return this.doctors[id] ?? null; }
}

class FakeAppointmentRepository {
  constructor() { this.saved = null; }
  async save(appointment) {
    this.saved = appointment;
    return { ...appointment, id: 'app-1', status: 'pending' };
  }
}

class FakeNotificationService {
  constructor() { this.sent = null; }
  async sendNotification(payload) { this.sent = payload; }
}

const patient = { id: 'pat-1' };
const doctor = { id: 'doc-1' };

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
  const baseInput = { patientId: patient.id, doctorId: doctor.id, startAt: '2025-01-01T10:00:00Z', endAt: '2025-01-01T11:00:00Z', reason: 'Checkup' };

  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({}), doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, patientId: '' }), 'Patient id is required.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, doctorId: '' }), 'Doctor id is required.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({ doctor }), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, startAt: null }), 'Appointment start time is required.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({ doctor }), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, endAt: null }), 'Appointment end time is required.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({ doctor }), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, reason: ' ' }), 'Appointment reason is required.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({ doctor }), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, startAt: 'bad', endAt: 'also-bad' }), 'Invalid appointment date/time.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ patient }), doctorRepository: new FakeDoctorRepository({ doctor }), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute({ ...baseInput, startAt: '2025-01-01T11:00:00Z', endAt: '2025-01-01T10:00:00Z' }), 'Appointment end time must be after start time.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({}), doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute(baseInput), 'Patient not found.');
  await expectThrows(() => new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository(), notificationService: new FakeNotificationService() }).execute(baseInput), 'Doctor not found.');

  const appointmentRepo = new FakeAppointmentRepository();
  const notifier = new FakeNotificationService();
  const result = await new ScheduleAppointmentUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: appointmentRepo, notificationService: notifier }).execute(baseInput);
  assert.strictEqual(result.appointmentId, 'app-1');
  assert.strictEqual(result.status, 'pending');
  assert.ok(result.startAt instanceof Date);
  assert.ok(result.endAt instanceof Date);
  assert.ok(notifier.sent);
  assert.strictEqual(notifier.sent.recipientId, doctor.id);
}

wrapLegacyRun(run, 'scheduleAppointment.usecase');

