import assert from 'node:assert';
import { MarkAppointmentStatusUseCase } from '../../../../src/application/use-cases/doctor/markAppointmentStatus.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeAppointment {
  constructor({ id, doctorId }) {
    this.id = id;
    this.doctorId = doctorId;
    this.status = 'pending';
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
  markCompleted() {
    this.status = 'completed';
  }
  markNoShow() {
    this.status = 'no_show';
  }
  cancel() {
    this.status = 'cancelled';
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
    () => new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ appointmentId: appointment.id, status: 'completed' }),
    'Doctor id is required.',
  );

  // Missing appointmentId
  await expectThrows(
    () => new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ doctorId: doctor.id, status: 'completed' }),
    'Appointment id is required.',
  );

  // Invalid status
  await expectThrows(
    () => new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'weird' }),
    'Invalid appointment status.',
  );

  // Doctor not found
  await expectThrows(
    () => new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: appointment }) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'completed' }),
    'Doctor not found.',
  );

  // Appointment not found
  await expectThrows(
    () => new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({}) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'completed' }),
    'Appointment not found.',
  );

  // Doctor mismatch
  await expectThrows(
    () => new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: 'other' }) }) }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'completed' }),
    'Doctor is not assigned to this appointment.',
  );

  // Success completed
  const repoCompleted = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: doctor.id }) });
  const completedResult = await new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: repoCompleted }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'completed' });
  assert.strictEqual(completedResult.status, 'completed');
  assert.strictEqual(repoCompleted.saved.getStatus(), 'completed');

  // Success no_show
  const repoNoShow = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: doctor.id }) });
  const noShowResult = await new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: repoNoShow }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'no_show' });
  assert.strictEqual(noShowResult.status, 'no_show');
  assert.strictEqual(repoNoShow.saved.getStatus(), 'no_show');

  // Success cancelled
  const repoCancelled = new FakeAppointmentRepository({ [appointment.id]: new FakeAppointment({ id: appointment.id, doctorId: doctor.id }) });
  const cancelledResult = await new MarkAppointmentStatusUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: repoCancelled }).execute({ doctorId: doctor.id, appointmentId: appointment.id, status: 'cancelled' });
  assert.strictEqual(cancelledResult.status, 'cancelled');
  assert.strictEqual(repoCancelled.saved.getStatus(), 'cancelled');
}

run()
  .then(() => console.log('markAppointmentStatus.usecase tests passed'))
  .catch((err) => {
    console.error('markAppointmentStatus.usecase tests failed', err);
    process.exit(1);
  });
