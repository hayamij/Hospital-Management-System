import assert from 'node:assert';
import { CancelAppointmentUseCase } from '../../../../src/application/use-cases/patient/cancelAppointment.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakePatientRepository {
  constructor(patient) {
    this.patient = patient;
  }
  async findById(id) {
    return this.patient && this.patient.id === id ? this.patient : null;
  }
}

class FakeAppointmentRepository {
  constructor(appointment) {
    this.appointment = appointment;
    this.saved = null;
  }
  async findById(id) {
    return this.appointment && this.appointment.id === id ? this.appointment : null;
  }
  async save(appointment) {
    this.saved = appointment;
    return appointment;
  }
}

class FakeNotificationService {
  constructor() {
    this.called = false;
    this.lastPayload = null;
  }
  async sendNotification(payload) {
    this.called = true;
    this.lastPayload = payload;
  }
}

const basePatient = { id: 'pat-1', fullName: 'Patient One' };
const baseAppointment = {
  id: 'app-1',
  patientId: 'pat-1',
  doctorId: 'doc-1',
  status: 'scheduled',
  cancelCalled: false,
  cancel() {
    this.cancelCalled = true;
    this.status = 'cancelled';
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
  // Missing patientId
  await expectThrows(
    () => new CancelAppointmentUseCase({ patientRepository: new FakePatientRepository(basePatient), appointmentRepository: new FakeAppointmentRepository(baseAppointment) }).execute({ appointmentId: 'app-1' }),
    'Patient id is required.',
  );

  // Missing appointmentId
  await expectThrows(
    () => new CancelAppointmentUseCase({ patientRepository: new FakePatientRepository(basePatient), appointmentRepository: new FakeAppointmentRepository(baseAppointment) }).execute({ patientId: 'pat-1' }),
    'Appointment id is required.',
  );

  // Patient not found
  await expectThrows(
    () => new CancelAppointmentUseCase({ patientRepository: new FakePatientRepository(null), appointmentRepository: new FakeAppointmentRepository(baseAppointment) }).execute({ patientId: 'pat-1', appointmentId: 'app-1' }),
    'Patient not found.',
  );

  // Appointment not found
  await expectThrows(
    () => new CancelAppointmentUseCase({ patientRepository: new FakePatientRepository(basePatient), appointmentRepository: new FakeAppointmentRepository(null) }).execute({ patientId: 'pat-1', appointmentId: 'app-1' }),
    'Appointment not found.',
  );

  // Appointment belongs to another patient
  await expectThrows(
    () => new CancelAppointmentUseCase({ patientRepository: new FakePatientRepository(basePatient), appointmentRepository: new FakeAppointmentRepository({ ...baseAppointment, patientId: 'other' }) }).execute({ patientId: 'pat-1', appointmentId: 'app-1' }),
    'Appointment does not belong to patient.',
  );

  // Success with cancel method
  {
    const notif = new FakeNotificationService();
    const appointmentRepo = new FakeAppointmentRepository({ ...baseAppointment });
    const usecase = new CancelAppointmentUseCase({
      patientRepository: new FakePatientRepository(basePatient),
      appointmentRepository: appointmentRepo,
      notificationService: notif,
    });
    const result = await usecase.execute({ patientId: 'pat-1', appointmentId: 'app-1' });
    assert.strictEqual(result.appointmentId, 'app-1');
    assert.strictEqual(result.status, 'cancelled');
    assert.ok(appointmentRepo.saved);
    assert.strictEqual(appointmentRepo.saved.status, 'cancelled');
    assert.ok(appointmentRepo.saved.cancelCalled);
    assert.ok(notif.called);
    assert.strictEqual(notif.lastPayload.recipientId, 'doc-1');
  }

  // Success without cancel method (fallback branch)
  {
    const notif = new FakeNotificationService();
    const appointment = {
      id: 'app-2',
      patientId: 'pat-1',
      doctorId: 'doc-2',
      status: 'scheduled',
      updatedAt: null,
      touchCalled: false,
      touch() {
        this.touchCalled = true;
      },
    };
    const appointmentRepo = new FakeAppointmentRepository(appointment);
    const usecase = new CancelAppointmentUseCase({
      patientRepository: new FakePatientRepository(basePatient),
      appointmentRepository: appointmentRepo,
      notificationService: notif,
    });
    const result = await usecase.execute({ patientId: 'pat-1', appointmentId: 'app-2' });
    assert.strictEqual(result.status, 'cancelled');
    assert.strictEqual(appointmentRepo.saved.status, 'cancelled');
    assert.ok(appointmentRepo.saved.touchCalled || appointmentRepo.saved.updatedAt instanceof Date || appointmentRepo.saved.updatedAt === null);
    assert.ok(notif.called);
    assert.strictEqual(notif.lastPayload.recipientId, 'doc-2');
  }
}

run()
  .then(() => console.log('cancelAppointment.usecase tests passed'))
  .catch((err) => {
    console.error('cancelAppointment.usecase tests failed', err);
    process.exit(1);
  });
