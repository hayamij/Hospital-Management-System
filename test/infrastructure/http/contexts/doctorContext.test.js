import assert from 'node:assert';
import { createDoctorUseCases } from '../../../../server/infrastructure/http/contexts/doctorContext.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakeDoctorRepository {
  constructor(doctors = {}) {
    this.doctors = doctors;
  }
  async findById(id) {
    return this.doctors[id] ?? null;
  }
}

class FakePatientRepository {
  constructor(patients = {}) {
    this.patients = patients;
  }
  async findById(id) {
    return this.patients[id] ?? null;
  }
}

class FakeMedicalRecordRepository {
  constructor(record = null) {
    this.record = record;
  }
  async findByPatientId(patientId) {
    if (!this.record) return null;
    return this.record.patientId === patientId ? this.record : null;
  }
}

const fakeDeps = ({ medicalRecordRepository }) => ({
  userRepository: {},
  doctorRepository: new FakeDoctorRepository({ 'doc-1': { id: 'doc-1' } }),
  patientRepository: new FakePatientRepository({ 'pat-1': { id: 'pat-1' } }),
  appointmentRepository: {},
  medicalRecordRepository,
  messageRepository: {},
  labResultRepository: {},
  authService: {},
});

async function run() {
  // Preserve metadata when record exists.
  {
    const recordCreatedAt = new Date('2026-04-05T10:00:00.000Z');
    const useCases = createDoctorUseCases(
      fakeDeps({
        medicalRecordRepository: new FakeMedicalRecordRepository({
          id: 'mr-1',
          patientId: 'pat-1',
          entries: [],
          createdAt: recordCreatedAt,
        }),
      })
    );

    const result = await useCases.accessPatientChartUseCase.execute({
      doctorId: 'doc-1',
      patientId: 'pat-1',
    });

    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.pageSize, 0);
    assert.strictEqual(result.total, 0);
    assert.deepStrictEqual(result.records, []);
    assert.strictEqual(result.patientId, 'pat-1');
    assert.strictEqual(result.recordId, 'mr-1');
    assert.strictEqual(result.recordCreatedAt, recordCreatedAt);
    assert.strictEqual(result.hasRecord, true);
  }

  // Preserve no-record signal when chart is empty.
  {
    const useCases = createDoctorUseCases(
      fakeDeps({ medicalRecordRepository: new FakeMedicalRecordRepository(null) })
    );

    const result = await useCases.accessPatientChartUseCase.execute({
      doctorId: 'doc-1',
      patientId: 'pat-1',
    });

    assert.strictEqual(result.recordId, null);
    assert.strictEqual(result.recordCreatedAt, null);
    assert.strictEqual(result.hasRecord, false);
    assert.deepStrictEqual(result.records, []);
  }
}

wrapLegacyRun(run, 'doctorContext');
