import assert from 'node:assert';
import { SqlMessageRepository } from '../../../../server/infrastructure/db/repositories/messageRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

async function run() {
  const pool = new FakePool([{ id: 'msg-1', subject: null, content: 'Hi' }]);
  const repo = new SqlMessageRepository(pool);
  const created = await repo.create({ fromPatientId: 'p1', toDoctorId: 'd1', message: 'Hi', content: 'Hi', subject: undefined });
  assert.strictEqual(created.id, 'msg-1');
  assert.ok(pool.calls[0].text.includes('INSERT INTO messages'));
  assert.deepStrictEqual(pool.calls[0].params.slice(1, 3), ['p1', 'd1']);
}

wrapLegacyRun(run, 'messageRepository');

