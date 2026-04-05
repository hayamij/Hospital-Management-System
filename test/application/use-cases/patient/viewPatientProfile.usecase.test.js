import assert from 'node:assert';
import { ViewPatientProfileUseCase } from '../../../../server/application/use-cases/patient/viewPatientProfile.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; }
  async findById(id) { return this.patients[id] ?? null; }
}

async function expectThrows(fn, message) {
  let threw = false;
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError, 'Expected DomainError');
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

const patient = {
  id: 'pat-1',
  fullName: 'Jane Doe',
  dateOfBirth: new Date('1990-01-01'),
  contactInfo: {
    email: 'jane@example.com',
    phone: '0901234567',
    address: '123 Street',
    emergencyContact: 'Peanut allergy',
  },
  status: 'active',
  assignedDoctorId: 'doc-1',
};

async function run() {
  await expectThrows(
    () => new ViewPatientProfileUseCase({ patientRepository: new FakePatientRepository({}) }).execute({}),
    'Patient id is required.'
  );

  await expectThrows(
    () => new ViewPatientProfileUseCase({ patientRepository: new FakePatientRepository({}) }).execute({ patientId: patient.id }),
    'Patient not found.'
  );

  const result = await new ViewPatientProfileUseCase({
    patientRepository: new FakePatientRepository({ [patient.id]: patient }),
  }).execute({ patientId: patient.id });

  assert.strictEqual(result.patientId, patient.id);
  assert.strictEqual(result.fullName, patient.fullName);
  assert.strictEqual(result.email, patient.contactInfo.email);
  assert.strictEqual(result.phone, patient.contactInfo.phone);
  assert.strictEqual(result.address, patient.contactInfo.address);
  assert.strictEqual(result.emergencyContact, patient.contactInfo.emergencyContact);
  assert.strictEqual(result.assignedDoctorId, patient.assignedDoctorId);
}

wrapLegacyRun(run, 'viewPatientProfile.usecase');
