import assert from 'node:assert';
import { DownloadInvoiceUseCase } from '../../../../src/application/use-cases/patient/downloadInvoice.usecase.js';
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

class FakeBillingRepository {
  constructor(billings) {
    this.billings = billings;
  }

  async findById(id) {
    return this.billings[id] ?? null;
  }
}

const patient = { id: 'pat-1' };
const invoice = {
  id: 'inv-1',
  patientId: patient.id,
  invoiceNumber: 'INV-1',
  status: 'open',
  dueDate: '2026-04-20',
  charges: [
    { description: 'Consultation', amount: 100 },
    { description: 'Medication', amount: 50 },
  ],
};

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
  await expectThrows(
    () => new DownloadInvoiceUseCase({ patientRepository: new FakePatientRepository({}), billingRepository: new FakeBillingRepository({}) }).execute({ invoiceId: invoice.id }),
    'Patient id is required.',
  );

  await expectThrows(
    () => new DownloadInvoiceUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), billingRepository: new FakeBillingRepository({}) }).execute({ patientId: patient.id }),
    'Invoice id is required.',
  );

  await expectThrows(
    () => new DownloadInvoiceUseCase({ patientRepository: new FakePatientRepository({}), billingRepository: new FakeBillingRepository({ [invoice.id]: invoice }) }).execute({ patientId: patient.id, invoiceId: invoice.id }),
    'Patient not found.',
  );

  await expectThrows(
    () => new DownloadInvoiceUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), billingRepository: new FakeBillingRepository({}) }).execute({ patientId: patient.id, invoiceId: invoice.id }),
    'Invoice not found.',
  );

  await expectThrows(
    () => new DownloadInvoiceUseCase({ patientRepository: new FakePatientRepository({ [patient.id]: patient }), billingRepository: new FakeBillingRepository({ [invoice.id]: { ...invoice, patientId: 'pat-2' } }) }).execute({ patientId: patient.id, invoiceId: invoice.id }),
    'Invoice does not belong to patient.',
  );

  const result = await new DownloadInvoiceUseCase({
    patientRepository: new FakePatientRepository({ [patient.id]: patient }),
    billingRepository: new FakeBillingRepository({ [invoice.id]: invoice }),
  }).execute({ patientId: patient.id, invoiceId: invoice.id });

  assert.strictEqual(result.invoiceId, invoice.id);
  assert.strictEqual(result.filename, `${invoice.id}.json`);
  assert.strictEqual(result.contentType, 'application/json');

  const payload = JSON.parse(result.file);
  assert.strictEqual(payload.patientId, patient.id);
  assert.strictEqual(payload.amount, 150);
}

wrapLegacyRun(run, 'downloadInvoice.usecase');
