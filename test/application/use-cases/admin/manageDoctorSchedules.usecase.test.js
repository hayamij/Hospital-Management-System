import assert from 'node:assert';
import { ManageDoctorSchedulesUseCase } from '../../../../src/application/use-cases/admin/manageDoctorSchedules.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeDoctor {
  constructor(id) {
    this.id = id;
    this.availableSlotsPerDay = 0;
  }
  setAvailability(slots) {
    this.availableSlotsPerDay = slots;
  }
  getAvailableSlotsPerDay() {
    return this.availableSlotsPerDay;
  }
}

class FakeDoctorRepository {
  constructor(doctors) {
    this.doctors = doctors;
    this.saved = null;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
  async save(doctor) {
    this.saved = doctor;
    this.doctors[doctor.id] = doctor;
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
const doctor = new FakeDoctor('doc-1');

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
  // Missing adminId
  await expectThrows(
    () => new ManageDoctorSchedulesUseCase({ doctorRepository: new FakeDoctorRepository({}), userRepository: new FakeUserRepository({}) }).execute({ doctorId: doctor.id, slotsPerDay: 5 }),
    'Admin id is required.',
  );

  // Missing doctorId
  await expectThrows(
    () => new ManageDoctorSchedulesUseCase({ doctorRepository: new FakeDoctorRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, slotsPerDay: 5 }),
    'Doctor id is required.',
  );

  // Missing slotsPerDay
  await expectThrows(
    () => new ManageDoctorSchedulesUseCase({ doctorRepository: new FakeDoctorRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, doctorId: doctor.id }),
    'Slots per day is required.',
  );

  // Negative slots
  await expectThrows(
    () => new ManageDoctorSchedulesUseCase({ doctorRepository: new FakeDoctorRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, doctorId: doctor.id, slotsPerDay: -1 }),
    'Slots per day must be a non-negative number.',
  );

  // Non-admin user
  await expectThrows(
    () => new ManageDoctorSchedulesUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: doctor }), userRepository: new FakeUserRepository({ [admin.id]: { ...admin, role: 'patient' } }) }).execute({ adminId: admin.id, doctorId: doctor.id, slotsPerDay: 4 }),
    'Access denied. Admin role required.',
  );

  // Doctor not found
  await expectThrows(
    () => new ManageDoctorSchedulesUseCase({ doctorRepository: new FakeDoctorRepository({}), userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, doctorId: doctor.id, slotsPerDay: 4 }),
    'Doctor not found.',
  );

  // Success
  const repo = new FakeDoctorRepository({ [doctor.id]: new FakeDoctor(doctor.id) });
  const result = await new ManageDoctorSchedulesUseCase({ doctorRepository: repo, userRepository: new FakeUserRepository({ [admin.id]: admin }) }).execute({ adminId: admin.id, doctorId: doctor.id, slotsPerDay: '6' });
  assert.strictEqual(result.doctorId, doctor.id);
  assert.strictEqual(result.slotsPerDay, 6);
  assert.strictEqual(repo.saved.getAvailableSlotsPerDay(), 6);
}

run()
  .then(() => console.log('manageDoctorSchedules.usecase tests passed'))
  .catch((err) => {
    console.error('manageDoctorSchedules.usecase tests failed', err);
    process.exit(1);
  });
