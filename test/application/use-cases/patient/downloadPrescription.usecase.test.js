import assert from 'node:assert';
import { DownloadPrescriptionUseCase } from '../../../../src/application/use-cases/patient/downloadPrescription.usecase.js';
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

class FakePrescriptionRepository {
  constructor(prescriptions) {
    this.prescriptions = prescriptions;
  }
  async findById(id) {
    return this.prescriptions[id] ?? null;
  }
}

const patient = { id: 'pat-1' };
const prescription = { id: 'rx-1', patientId: patient.id, content: 'take 1 pill' };

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
    () => new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({}), prescriptionRepository: new FakePrescriptionRepository({}) }).execute({ prescriptionId: prescription.id }),
    'Patient id is required.',
  );

  // Missing prescriptionId
  await expectThrows(
    () => new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), prescriptionRepository: new FakePrescriptionRepository({}) }).execute({ patientId: patient.id }),
    'Prescription id is required.',
  );

  // Patient not found
  await expectThrows(
    () => new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({}), prescriptionRepository: new FakePrescriptionRepository({ [prescription.id]: prescription }) }).execute({ patientId: patient.id, prescriptionId: prescription.id }),
    'Patient not found.',
  );

  // Prescription not found
  await expectThrows(
    () => new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), prescriptionRepository: new FakePrescriptionRepository({}) }).execute({ patientId: patient.id, prescriptionId: prescription.id }),
    'Prescription not found.',
  );

  // Prescription belongs to another patient
  await expectThrows(
    () => new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), prescriptionRepository: new FakePrescriptionRepository({ [prescription.id]: { ...prescription, patientId: 'other' } }) }).execute({ patientId: patient.id, prescriptionId: prescription.id }),
    'Prescription does not belong to patient.',
  );

  // Success with entity content
  const result = await new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), prescriptionRepository: new FakePrescriptionRepository({ [prescription.id]: prescription }) }).execute({ patientId: patient.id, prescriptionId: prescription.id });
  assert.strictEqual(result.prescriptionId, prescription.id);
  assert.strictEqual(result.content, 'take 1 pill');

  // Success with primitive prescription
  const result2 = await new DownloadPrescriptionUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), prescriptionRepository: new FakePrescriptionRepository({ [prescription.id]: 'PDF-BLOB' }) }).execute({ patientId: patient.id, prescriptionId: prescription.id });
  assert.strictEqual(result2.content, 'PDF-BLOB');
}

wrapLegacyRun(run, 'downloadPrescription.usecase');

