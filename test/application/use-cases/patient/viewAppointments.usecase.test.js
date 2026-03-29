import assert from 'node:assert';
import { ViewAppointmentsUseCase } from '../../../../server/application/use-cases/patient/viewAppointments.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; }
  async findById(id) { return this.patients[id] ?? null; }
}

class FakeAppointmentRepository {
  constructor(appointments) { this.appointments = appointments; this.lastQuery = null; }
  async listByPatient(patientId) {
    this.lastQuery = { patientId };
    return this.appointments[patientId] ?? [];
  }
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

const patient = { id: 'pat-1' };
const appointments = [
  { id: 'a1', status: 'scheduled', date: new Date('2025-01-01') },
  { id: 'a2', status: 'completed', date: new Date('2025-02-01') },
];

async function run() {
  await expectThrows(() => new ViewAppointmentsUseCase({ patientRepository: new FakePatientRepository({}) }).execute({}), 'Patient id is required.');
  await expectThrows(() => new ViewAppointmentsUseCase({ patientRepository: new FakePatientRepository({}) }).execute({ patientId: patient.id }), 'Patient not found.');

  const repo = new FakeAppointmentRepository({ [patient.id]: appointments });
  const result = await new ViewAppointmentsUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), appointmentRepository: repo }).execute({ patientId: patient.id, status: 'scheduled', page: 1, pageSize: 10 });
  assert.strictEqual(result.total, 1);
  assert.strictEqual(result.appointments[0].id, 'a1');
  assert.deepStrictEqual(repo.lastQuery.patientId, patient.id);
}

wrapLegacyRun(run, 'viewAppointments.usecase');

