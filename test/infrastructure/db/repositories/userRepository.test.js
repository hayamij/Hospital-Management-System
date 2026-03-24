import assert from 'node:assert';
import { SqlUserRepository } from '../../../../src/infrastructure/db/repositories/userRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

function sampleRow() {
  return {
    id: 'u1',
    email: 'a@example.com',
    password_hash: 'hash',
    role: 'patient',
    status: 'active',
    patient_id: 'p1',
    doctor_id: null,
    full_name: 'John',
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };
}

async function run() {
  // findByEmail
  const poolEmail = new FakePool([sampleRow()]);
  const repoEmail = new SqlUserRepository(poolEmail);
  const byEmail = await repoEmail.findByEmail('a@example.com');
  assert.strictEqual(byEmail.email, 'a@example.com');

  // findById
  const poolId = new FakePool([sampleRow()]);
  const repoId = new SqlUserRepository(poolId);
  const byId = await repoId.findById('u1');
  assert.strictEqual(byId.id, 'u1');

  // save insert
  const poolInsert = new FakePool([sampleRow()]);
  const repoInsert = new SqlUserRepository(poolInsert);
  const created = await repoInsert.save({ email: 'a@example.com', passwordHash: 'hash', role: 'patient' });
  assert.strictEqual(created.id, 'u1');
  assert.ok(poolInsert.calls.some((c) => c.text.includes('INSERT INTO users') || c.text.startsWith('UPDATE users')));

  // save update
  const poolUpdate = new FakePool([sampleRow()]);
  const repoUpdate = new SqlUserRepository(poolUpdate);
  await repoUpdate.save({ id: 'u1', email: 'b@example.com', passwordHash: 'hash', role: 'patient', status: 'active' });
  assert.ok(poolUpdate.calls.some((c) => c.text.startsWith('UPDATE users')));
}

wrapLegacyRun(run, 'userRepository');

