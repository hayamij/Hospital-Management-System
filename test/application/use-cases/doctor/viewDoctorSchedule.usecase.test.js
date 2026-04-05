import assert from 'node:assert';
import { ViewDoctorScheduleUseCase } from '../../../../server/application/use-cases/doctor/viewDoctorSchedule.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakeAppointmentRepository {
  constructor(list = []) {
    this.list = list;
    this.lastArgs = null;
  }
  async listByDoctor(doctorId, range) {
    this.lastArgs = { doctorId, range };
    return this.list;
  }
}

const doctor = { id: 'doc-1' };

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
    () => new ViewDoctorScheduleUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository([]) }).execute({}),
    'Doctor id is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new ViewDoctorScheduleUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository([]) }).execute({ doctorId: doctor.id }),
    'Doctor not found.',
  );

  // Success with range parsing
  const apptRepo = new FakeAppointmentRepository([{ id: 'appt-1' }]);
  const fromStr = '2025-01-01T00:00:00Z';
  const toStr = '2025-01-02T00:00:00Z';
  const result = await new ViewDoctorScheduleUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: apptRepo }).execute({ doctorId: doctor.id, from: fromStr, to: toStr });
  assert.strictEqual(result.doctorId, doctor.id);
  assert.deepStrictEqual(result.appointments, [{ id: 'appt-1' }]);
  assert.strictEqual(result.page, 1);
  assert.strictEqual(result.pageSize, 20);
  assert.strictEqual(result.total, 1);
  assert.strictEqual(apptRepo.lastArgs.doctorId, doctor.id);
  assert.ok(apptRepo.lastArgs.range.from instanceof Date);
  assert.ok(apptRepo.lastArgs.range.to instanceof Date);

  // Status filter + pagination
  const scheduleWithStatuses = [
    { id: 'appt-pending', status: 'pending' },
    { id: 'appt-requested', status: 'requested' },
    { id: 'appt-completed-1', status: 'completed' },
    { id: 'appt-completed-2', status: 'completed' },
  ];
  const filteredRepo = new FakeAppointmentRepository(scheduleWithStatuses);
  const filteredResult = await new ViewDoctorScheduleUseCase({
    doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
    appointmentRepository: filteredRepo,
  }).execute({ doctorId: doctor.id, status: 'completed', page: 1, pageSize: 1 });

  assert.strictEqual(filteredResult.total, 2);
  assert.strictEqual(filteredResult.page, 1);
  assert.strictEqual(filteredResult.pageSize, 1);
  assert.deepStrictEqual(filteredResult.appointments, [{ id: 'appt-completed-1', status: 'completed' }]);

  const pendingResult = await new ViewDoctorScheduleUseCase({
    doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }),
    appointmentRepository: new FakeAppointmentRepository(scheduleWithStatuses),
  }).execute({ doctorId: doctor.id, status: 'pending' });
  assert.strictEqual(pendingResult.total, 2);

  // Invalid pagination
  await expectThrows(
    () => new ViewDoctorScheduleUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: new FakeAppointmentRepository([]) }).execute({ doctorId: doctor.id, page: 0, pageSize: 20 }),
    'Invalid pagination parameters.',
  );
}

wrapLegacyRun(run, 'viewDoctorSchedule.usecase');

