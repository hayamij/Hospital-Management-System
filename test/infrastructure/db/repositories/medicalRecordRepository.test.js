import assert from 'node:assert';
import { SqlMedicalRecordRepository } from '../../../../server/infrastructure/db/repositories/medicalRecordRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

function sampleRow() {
  return {
    id: 'm1',
    patient_id: 'p1',
    entries: [{ note: 'Initial' }],
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };
}

async function run() {
  // findById
  const poolFind = new FakePool([sampleRow()]);
  const repoFind = new SqlMedicalRecordRepository(poolFind);
  const found = await repoFind.findById('m1');
  assert.strictEqual(found.getPatientId(), 'p1');

  // findByPatientId
  const poolPatient = new FakePool([sampleRow()]);
  const repoPatient = new SqlMedicalRecordRepository(poolPatient);
  const byPatient = await repoPatient.findByPatientId('p1');
  assert.strictEqual(byPatient.getEntries().length, 1);

  // save insert
  const poolInsert = new FakePool([sampleRow()]);
  const repoInsert = new SqlMedicalRecordRepository(poolInsert);
  const created = await repoInsert.save({ patientId: 'p1', entries: [] });
  assert.strictEqual(created.id, 'm1');
  assert.ok(poolInsert.calls.some((c) => c.text.includes('INSERT INTO medical_records') || c.text.startsWith('UPDATE medical_records')));

  // save update
  const poolUpdate = new FakePool([sampleRow()]);
  const repoUpdate = new SqlMedicalRecordRepository(poolUpdate);
  await repoUpdate.save({ id: 'm1', patientId: 'p1', entries: [{ note: 'New' }] });
  assert.ok(poolUpdate.calls.some((c) => c.text.startsWith('UPDATE medical_records')));
}

wrapLegacyRun(run, 'medicalRecordRepository');

