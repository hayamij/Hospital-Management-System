import assert from 'node:assert';
import { SqlBillingRepository } from '../../../../src/infrastructure/db/repositories/billingRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

function sampleRow() {
  return {
    id: 'b1',
    invoice_number: 'INV-1',
    patient_id: 'p1',
    charges: [{ description: 'Consult', amount: 10 }],
    status: 'draft',
    due_date: null,
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };
}

async function run() {
  // findById
  const poolFind = new FakePool([sampleRow()]);
  const repoFind = new SqlBillingRepository(poolFind);
  const found = await repoFind.findById('b1');
  assert.strictEqual(found.invoiceNumber, 'INV-1');

  // listByPatient
  const poolList = new FakePool([sampleRow()]);
  const repoList = new SqlBillingRepository(poolList);
  const list = await repoList.listByPatient('p1');
  assert.strictEqual(list.length, 1);
  assert.ok(poolList.calls[0].text.includes('FROM billings WHERE patient_id'));

  // save insert
  const poolInsert = new FakePool([sampleRow()]);
  const repoInsert = new SqlBillingRepository(poolInsert);
  const created = await repoInsert.save({ invoiceNumber: 'INV-1', patientId: 'p1', charges: [{ description: 'Consult', amount: 10 }], status: 'draft' });
  assert.strictEqual(created.id, 'b1');
  assert.ok(poolInsert.calls[0].text.includes('INSERT INTO billings'));

  // save update
  const poolUpdate = new FakePool([sampleRow()]);
  const repoUpdate = new SqlBillingRepository(poolUpdate);
  await repoUpdate.save({ id: 'b1', invoiceNumber: 'INV-1', patientId: 'p1', charges: [{ description: 'Consult', amount: 10 }], status: 'issued', dueDate: null });
  assert.ok(poolUpdate.calls[0].text.startsWith('UPDATE billings'));
}

wrapLegacyRun(run, 'billingRepository');

