import assert from 'node:assert';
import { Billing } from '../../../src/domain/entities/billing.js';
import { DomainError } from '../../../src/domain/exceptions/domainError.js';

async function expectThrows(fn, message) {
  let threw = false;
  try { await fn(); } catch (err) {
    threw = true;
    assert.ok(err instanceof DomainError);
    if (message) assert.strictEqual(err.message, message);
  }
  assert.ok(threw, 'Expected function to throw');
}

function sampleCharges() {
  return [
    { description: 'Consult', amount: 50 },
    { description: 'Lab', amount: 20 },
  ];
}

async function run() {
  await expectThrows(() => Promise.resolve(new Billing({ id: 'b1', invoiceNumber: ' ', patientId: 'p1', charges: sampleCharges() })), 'Invoice number is required.');
  await expectThrows(() => Promise.resolve(new Billing({ id: 'b1', invoiceNumber: 'INV-1', patientId: 'p1', charges: [] })), 'Billing must contain at least one charge line.');
  await expectThrows(() => Promise.resolve(new Billing({ id: 'b1', invoiceNumber: 'INV-1', patientId: 'p1', charges: [{ description: 'Bad', amount: -1 }] })), 'Charge amounts cannot be negative.');

  const createdAt = new Date('2025-01-01T00:00:00Z');
  const bill = new Billing({ id: 'b1', invoiceNumber: ' INV-1 ', patientId: 'p1', charges: sampleCharges(), createdAt });
  assert.strictEqual(bill.getInvoiceNumber(), 'INV-1');
  assert.strictEqual(bill.getPatientId(), 'p1');
  assert.strictEqual(bill.getCharges().length, 2);
  assert.strictEqual(bill.calculateTotal(), 70);
  assert.strictEqual(bill.getStatus(), 'draft');

  await expectThrows(() => Promise.resolve(bill.issue(new Date('2024-12-31T00:00:00Z'))), 'Due date cannot be before invoice creation.');
  bill.issue(new Date('2025-01-10T00:00:00Z'));
  assert.strictEqual(bill.getStatus(), 'issued');

  bill.markPaid();
  assert.strictEqual(bill.getStatus(), 'paid');
  await expectThrows(() => Promise.resolve(bill.void()), 'Cannot void a paid invoice.');

  const bill2 = new Billing({ id: 'b2', invoiceNumber: 'INV-2', patientId: 'p1', charges: sampleCharges() });
  bill2.void();
  assert.strictEqual(bill2.getStatus(), 'void');
  await expectThrows(() => Promise.resolve(bill2.markPaid()), 'Cannot pay a void invoice.');
}

run()
  .then(() => console.log('billing tests passed'))
  .catch((err) => {
    console.error('billing tests failed', err);
    process.exit(1);
  });
