import assert from 'node:assert';
import { UpdateDoctorProfileAndAvailabilityUseCase } from '../../../../src/application/use-cases/doctor/updateDoctorProfileAndAvailability.usecase.js';
import { DomainError } from '../../../../src/domain/exceptions/domainError.js';

class FakeDoctor {
  constructor({ id, fullName = 'Dr A', specialization = 'Cardio', department = 'Heart', status = 'active' }) {
    this.id = id;
    this.fullName = fullName;
    this.specialization = specialization;
    this.department = department;
    this.status = status;
    this.availableSlotsPerDay = 3;
    this.touched = false;
  }
  setAvailability(slots) {
    this.availableSlotsPerDay = slots;
  }
  getAvailableSlotsPerDay() {
    return this.availableSlotsPerDay;
  }
  activate() { this.status = 'active'; }
  deactivate() { this.status = 'inactive'; }
  markOnLeave() { this.status = 'on_leave'; }
  touch() { this.touched = true; }
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

const doctor = new FakeDoctor({ id: 'doc-1' });

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
    () => new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: new FakeDoctorRepository({}) }).execute({ profile: { fullName: 'New' } }),
    'Doctor id is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: new FakeDoctorRepository({}) }).execute({ doctorId: doctor.id, profile: { fullName: 'New' } }),
    'Doctor not found.',
  );

  // Empty name
  await expectThrows(
    () => new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: new FakeDoctor({ id: doctor.id }) }) }).execute({ doctorId: doctor.id, profile: { fullName: ' ' } }),
    'Doctor name cannot be empty.',
  );

  // Empty specialization
  await expectThrows(
    () => new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: new FakeDoctor({ id: doctor.id }) }) }).execute({ doctorId: doctor.id, profile: { specialization: '' } }),
    'Specialization cannot be empty.',
  );

  // Invalid status
  await expectThrows(
    () => new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: new FakeDoctor({ id: doctor.id }) }) }).execute({ doctorId: doctor.id, profile: { status: 'weird' } }),
    'Invalid doctor status.',
  );

  // Negative slots
  await expectThrows(
    () => new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: new FakeDoctorRepository({ [doctor.id]: new FakeDoctor({ id: doctor.id }) }) }).execute({ doctorId: doctor.id, slotsPerDay: -1 }),
    'Slots per day must be non-negative.',
  );

  // Success update profile + slots
  const repo = new FakeDoctorRepository({ [doctor.id]: new FakeDoctor({ id: doctor.id }) });
  const result = await new UpdateDoctorProfileAndAvailabilityUseCase({ doctorRepository: repo }).execute({ doctorId: doctor.id, profile: { fullName: 'Dr New', specialization: 'Neuro', department: 'Brain', status: 'on_leave' }, slotsPerDay: '5' });
  assert.strictEqual(result.doctorId, doctor.id);
  assert.strictEqual(repo.saved.fullName, 'Dr New');
  assert.strictEqual(repo.saved.specialization, 'Neuro');
  assert.strictEqual(repo.saved.department, 'Brain');
  assert.strictEqual(repo.saved.status, 'on_leave');
  assert.strictEqual(repo.saved.getAvailableSlotsPerDay(), 5);
  assert.ok(repo.saved.touched);
}

run()
  .then(() => console.log('updateDoctorProfileAndAvailability.usecase tests passed'))
  .catch((err) => {
    console.error('updateDoctorProfileAndAvailability.usecase tests failed', err);
    process.exit(1);
  });
