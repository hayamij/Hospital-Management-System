import assert from 'node:assert';
import { RescheduleAppointmentUseCase } from '../../../../src/application/use-cases/patient/rescheduleAppointment.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(patients) {
    this.patients = patients;
  }
  async findById(id) {
    return this.patients[id] ?? null;
  }
}

class FakeAppointmentRepository {
  constructor(appointments) {
    this.appointments = appointments;
    this.saved = null;
  }
  async findById(id) {
    return this.appointments[id] ?? null;
  }
  async save(app) {
    this.saved = app;
    this.appointments[app.id] = app;
  }
}

class FakeNotificationService {
  constructor() {
    this.sent = null;
  }
  async sendNotification(payload) {
    this.sent = payload;
  }
}

const patient = { id: 'pat-1' };
const appointment = {
  id: 'app-1',
  patientId: patient.id,
  doctorId: 'doc-1',
  status: 'scheduled',
  startAt: new Date('2025-01-01T10:00:00Z'),
  endAt: new Date('2025-01-01T11:00:00Z'),
  reschedule(startAt, endAt) {
    this.startAt = startAt;
    this.endAt = endAt;
    this.status = 'rescheduled';
  },
};

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
    patientRepository: new FakePatientRepository({ [patient.id]: patient }),
    appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: { ...appointment } }),
    notificationService: new FakeNotificationService(),
  };

  await expectThrows(
    () => new RescheduleAppointmentUseCase(baseDeps).execute({ appointmentId: appointment.id, startAt: '2025-02-01', endAt: '2025-02-02' }),
    'Patient id is required.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase(baseDeps).execute({ patientId: patient.id, startAt: '2025-02-01', endAt: '2025-02-02' }),
    'Appointment id is required.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase(baseDeps).execute({ patientId: patient.id, appointmentId: appointment.id }),
    'New appointment time window is required.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase(baseDeps).execute({ patientId: patient.id, appointmentId: appointment.id, startAt: 'bad', endAt: 'also-bad' }),
    'Invalid appointment date/time.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase(baseDeps).execute({ patientId: patient.id, appointmentId: appointment.id, startAt: '2025-02-02', endAt: '2025-02-01' }),
    'Appointment end time must be after start time.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase({ ...baseDeps, patientRepository: new FakePatientRepository({}) }).execute({ patientId: patient.id, appointmentId: appointment.id, startAt: '2025-02-01', endAt: '2025-02-02' }),
    'Patient not found.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase({ ...baseDeps, appointmentRepository: new FakeAppointmentRepository({}) }).execute({ patientId: patient.id, appointmentId: appointment.id, startAt: '2025-02-01', endAt: '2025-02-02' }),
    'Appointment not found.',
  );

  await expectThrows(
    () => new RescheduleAppointmentUseCase({ ...baseDeps, appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: { ...appointment, patientId: 'other' } }) }).execute({ patientId: patient.id, appointmentId: appointment.id, startAt: '2025-02-01', endAt: '2025-02-02' }),
    'Appointment does not belong to patient.',
  );

  const newStart = '2025-02-01T09:00:00Z';
  const newEnd = '2025-02-01T10:00:00Z';
  const deps = {
    patientRepository: new FakePatientRepository({ [patient.id]: patient }),
    appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: { ...appointment } }),
    notificationService: new FakeNotificationService(),
  };
  const result = await new RescheduleAppointmentUseCase(deps).execute({ patientId: patient.id, appointmentId: appointment.id, startAt: newStart, endAt: newEnd });
  assert.strictEqual(result.appointmentId, appointment.id);
  assert.strictEqual(result.status, 'rescheduled');
  assert.ok(result.startAt instanceof Date);
  assert.ok(result.endAt instanceof Date);
  assert.strictEqual(deps.appointmentRepository.saved.status, 'rescheduled');
  assert.ok(deps.notificationService.sent);
  assert.strictEqual(deps.notificationService.sent.recipientId, 'doc-1');
}

wrapLegacyRun(run, 'rescheduleAppointment.usecase');

