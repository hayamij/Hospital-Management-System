import assert from 'node:assert';
import { ViewAvailableSlotsUseCase } from '../../../../src/application/use-cases/guest/viewAvailableSlots.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakeAppointmentRepository {
  constructor(slots) {
    this.slots = slots;
    this.lastArgs = null;
  }
  async listAvailableSlots(doctorId, range) {
    this.lastArgs = { doctorId, range };
    return this.slots;
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
    () => new ViewAvailableSlotsUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository([]) }).execute({}),
    'Doctor id is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new ViewAvailableSlotsUseCase({ doctorRepository: new FakeDoctorRepository({}), appointmentRepository: new FakeAppointmentRepository([]) }).execute({ doctorId: doctor.id }),
    'Doctor not found.',
  );

  // Success with range parsing
  const apptRepo = new FakeAppointmentRepository([{ startAt: new Date('2025-01-01T10:00:00Z') }]);
  const fromStr = '2025-01-01T00:00:00Z';
  const toStr = '2025-01-02T00:00:00Z';
  const result = await new ViewAvailableSlotsUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: apptRepo }).execute({ doctorId: doctor.id, from: fromStr, to: toStr });
  assert.strictEqual(result.doctorId, doctor.id);
  assert.deepStrictEqual(result.slots, [{ startAt: new Date('2025-01-01T10:00:00Z') }]);
  assert.strictEqual(apptRepo.lastArgs.doctorId, doctor.id);
  assert.ok(apptRepo.lastArgs.range.from instanceof Date);
  assert.ok(apptRepo.lastArgs.range.to instanceof Date);

  // Success with null slots
  const repoNull = new FakeAppointmentRepository(null);
  const resultNull = await new ViewAvailableSlotsUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), appointmentRepository: repoNull }).execute({ doctorId: doctor.id });
  assert.deepStrictEqual(resultNull.slots, []);
}

run()
  .then(() => console.log('viewAvailableSlots.usecase tests passed'))
  .catch((err) => {
    console.error('viewAvailableSlots.usecase tests failed', err);
    process.exit(1);
  });
