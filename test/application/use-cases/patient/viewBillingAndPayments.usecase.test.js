import assert from 'node:assert';
import { ViewBillingAndPaymentsUseCase } from '../../../../server/application/use-cases/patient/viewBillingAndPayments.usecase.js';
import { DomainError } from '../../../../server/domain/exceptions/domainError.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePatientRepository {
  constructor(patients) { this.patients = patients; }
  async findById(id) { return this.patients[id] ?? null; }
}

class FakeBillingRepository {
  constructor(bills) { this.bills = bills; this.lastQuery = null; }
  async listByPatient(patientId) {
    this.lastQuery = { patientId };
    return this.bills[patientId] ?? [];
  }
}

class FakePaymentRepository {
  constructor(payments) { this.payments = payments; this.lastQuery = null; }
  async listByPatient(patientId) {
    this.lastQuery = { patientId };
    return this.payments[patientId] ?? [];
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
const bills = [
  { id: 'b1', status: 'unpaid', date: new Date('2025-01-05') },
  { id: 'b2', status: 'paid', date: new Date('2025-02-05') },
];

async function run() {
  await expectThrows(() => new ViewBillingAndPaymentsUseCase({ patientRepository: new FakePatientRepository({}) }).execute({}), 'Patient id is required.');
  await expectThrows(() => new ViewBillingAndPaymentsUseCase({ patientRepository: new FakePatientRepository({}) }).execute({ patientId: patient.id }), 'Patient not found.');

  const billingRepo = new FakeBillingRepository({ [patient.id]: bills });
  const paymentRepo = new FakePaymentRepository({ [patient.id]: [{ id: 'p1', amount: 20 }] });
  const result = await new ViewBillingAndPaymentsUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), billingRepository: billingRepo, paymentRepository: paymentRepo }).execute({ patientId: patient.id, status: 'paid', page: 1, pageSize: 10 });
  assert.strictEqual(result.total, 2);
  assert.strictEqual(result.billings[0].id, 'b2');
  assert.strictEqual(result.payments[0].id, 'p1');
  assert.strictEqual(billingRepo.lastQuery.patientId, patient.id);
  assert.strictEqual(paymentRepo.lastQuery.patientId, patient.id);
}

wrapLegacyRun(run, 'viewBillingAndPayments.usecase');

