import assert from 'node:assert';
import { SqlPaymentRepository } from '../../../../src/infrastructure/db/repositories/paymentRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

async function run() {
  const pool = new FakePool([{ id: 'pay-1', patient_id: 'p1' }]);
  const repo = new SqlPaymentRepository(pool);
  const list = await repo.listByPatient('p1');
  assert.strictEqual(list[0].id, 'pay-1');
  assert.ok(pool.calls[0].text.includes('FROM payments'));
}

wrapLegacyRun(run, 'paymentRepository');

