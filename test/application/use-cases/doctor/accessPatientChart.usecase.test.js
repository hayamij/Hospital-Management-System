import assert from 'node:assert';
import { AccessPatientChartUseCase } from '../../../../server/application/use-cases/doctor/accessPatientChart.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeDoctorRepository {
  constructor(doctor) {
    this.doctor = doctor;
  }
  async findById(id) {
    return this.doctor && this.doctor.id === id ? this.doctor : null;
  }
}

class FakePatientRepository {
  constructor(patient) {
    this.patient = patient;
  }
  async findById(id) {
    return this.patient && this.patient.id === id ? this.patient : null;
  }
}

class FakeMedicalRecordRepository {
  constructor(record) {
    this.record = record;
  }
  async findByPatientId(id) {
    return this.record && this.record.patientId === id ? this.record : null;
  }
}

const baseDoctor = { id: 'doc-1', fullName: 'Dr. Who' };
const basePatient = { id: 'pat-1', fullName: 'Patient One' };

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
    () => new AccessPatientChartUseCase({ doctorRepository: new FakeDoctorRepository(baseDoctor), patientRepository: new FakePatientRepository(basePatient), medicalRecordRepository: new FakeMedicalRecordRepository(null) }).execute({ patientId: 'pat-1' }),
    'Doctor id is required.',
  );

  // Missing patientId
  await expectThrows(
    () => new AccessPatientChartUseCase({ doctorRepository: new FakeDoctorRepository(baseDoctor), patientRepository: new FakePatientRepository(basePatient), medicalRecordRepository: new FakeMedicalRecordRepository(null) }).execute({ doctorId: 'doc-1' }),
    'Patient id is required.',
  );

  // Doctor not found
  await expectThrows(
    () => new AccessPatientChartUseCase({ doctorRepository: new FakeDoctorRepository(null), patientRepository: new FakePatientRepository(basePatient), medicalRecordRepository: new FakeMedicalRecordRepository(null) }).execute({ doctorId: 'doc-1', patientId: 'pat-1' }),
    'Doctor not found.',
  );

  // Patient not found
  await expectThrows(
    () => new AccessPatientChartUseCase({ doctorRepository: new FakeDoctorRepository(baseDoctor), patientRepository: new FakePatientRepository(null), medicalRecordRepository: new FakeMedicalRecordRepository(null) }).execute({ doctorId: 'doc-1', patientId: 'pat-1' }),
    'Patient not found.',
  );

  // No record returns empty entries
  {
    const usecase = new AccessPatientChartUseCase({
      doctorRepository: new FakeDoctorRepository(baseDoctor),
      patientRepository: new FakePatientRepository(basePatient),
      medicalRecordRepository: new FakeMedicalRecordRepository(null),
    });
    const result = await usecase.execute({ doctorId: 'doc-1', patientId: 'pat-1' });
    assert.strictEqual(result.patientId, 'pat-1');
    assert.deepStrictEqual(result.entries, []);
  }

  // Record with entries (entity with getEntries)
  {
    const record = { patientId: 'pat-1', getEntries: () => [{ note: 'entry1' }, { note: 'entry2' }] };
    const usecase = new AccessPatientChartUseCase({
      doctorRepository: new FakeDoctorRepository(baseDoctor),
      patientRepository: new FakePatientRepository(basePatient),
      medicalRecordRepository: new FakeMedicalRecordRepository(record),
    });
    const result = await usecase.execute({ doctorId: 'doc-1', patientId: 'pat-1' });
    assert.strictEqual(result.patientId, 'pat-1');
    assert.deepStrictEqual(result.entries, [{ note: 'entry1' }, { note: 'entry2' }]);
  }

  // Record with plain entries array
  {
    const record = { patientId: 'pat-1', entries: [{ note: 'entryA' }] };
    const usecase = new AccessPatientChartUseCase({
      doctorRepository: new FakeDoctorRepository(baseDoctor),
      patientRepository: new FakePatientRepository(basePatient),
      medicalRecordRepository: new FakeMedicalRecordRepository(record),
    });
    const result = await usecase.execute({ doctorId: 'doc-1', patientId: 'pat-1' });
    assert.deepStrictEqual(result.entries, [{ note: 'entryA' }]);
  }
}

wrapLegacyRun(run, 'accessPatientChart.usecase');

