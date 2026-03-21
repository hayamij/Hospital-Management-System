import assert from 'node:assert';
import { SqlPatientRepository } from '../../../../src/infrastructure/db/repositories/patientRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

function sampleRow() {
  return {
    id: 'p1',
    full_name: 'John Doe',
    date_of_birth: new Date('2000-01-01'),
    contact_email: 'a@example.com',
    contact_phone: '123',
    contact_address: 'Addr',
    emergency_contact: '911',
    status: 'active',
    assigned_doctor_id: 'd1',
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };
}

async function run() {
  // findById
  const poolFind = new FakePool([sampleRow()]);
  const repoFind = new SqlPatientRepository(poolFind);
  const found = await repoFind.findById('p1');
  assert.strictEqual(found.getName(), 'John Doe');
  assert.strictEqual(found.getAssignedDoctorId(), 'd1');

  // create insert
  const poolInsert = new FakePool([sampleRow()]);
  const repoInsert = new SqlPatientRepository(poolInsert);
  const created = await repoInsert.create({ fullName: 'John Doe', contactInfo: { email: 'a@example.com' }, status: 'active' });
  assert.strictEqual(created.id, 'p1');
  assert.ok(poolInsert.calls[0].text.includes('INSERT INTO patients'));

  // save update
  const poolUpdate = new FakePool([sampleRow()]);
  const repoUpdate = new SqlPatientRepository(poolUpdate);
  await repoUpdate.save({ id: 'p1', fullName: 'John Doe', status: 'active', contactInfo: { phone: '123' } });
  assert.ok(poolUpdate.calls[0].text.startsWith('UPDATE patients'));
}

wrapLegacyRun(run, 'patientRepository');

