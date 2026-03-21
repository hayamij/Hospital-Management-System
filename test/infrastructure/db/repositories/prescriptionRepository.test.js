import assert from 'node:assert';
import { SqlPrescriptionRepository } from '../../../../src/infrastructure/db/repositories/prescriptionRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

async function run() {
  const poolFind = new FakePool([{ id: 'pr1', patient_id: 'p1' }]);
  const repoFind = new SqlPrescriptionRepository(poolFind);
  const found = await repoFind.findById('pr1');
  assert.strictEqual(found.id, 'pr1');

  const poolList = new FakePool([{ id: 'pr1', patient_id: 'p1' }]);
  const repoList = new SqlPrescriptionRepository(poolList);
  const list = await repoList.listByPatient('p1');
  assert.strictEqual(list.length, 1);
  assert.ok(poolList.calls[0].text.includes('FROM prescriptions'));
}

wrapLegacyRun(run, 'prescriptionRepository');

