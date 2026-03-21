import assert from 'node:assert';
import { SqlDoctorRepository } from '../../../../src/infrastructure/db/repositories/doctorRepository.js';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

function sampleRow() {
  return {
    id: 'd1',
    full_name: 'Dr A',
    specialization: 'Cardio',
    department: 'Heart',
    available_slots_per_day: 3,
    contact_email: 'a@example.com',
    contact_phone: '123',
    status: 'active',
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };
}

async function run() {
  // findById
  const poolFind = new FakePool([sampleRow()]);
  const repoFind = new SqlDoctorRepository(poolFind);
  const found = await repoFind.findById('d1');
  assert.strictEqual(found.getName(), 'Dr A');
  assert.strictEqual(found.getSpecialization(), 'Cardio');

  // save (update path only supported)
  const poolSave = new FakePool([sampleRow()]);
  const repoSave = new SqlDoctorRepository(poolSave);
  await repoSave.save({ id: 'd1', fullName: 'Dr A', specialization: 'Cardio', department: 'Heart', availableSlotsPerDay: 2, contactInfo: { email: 'a@example.com', phone: '123' }, status: 'active' });
  assert.ok(poolSave.calls[0].text.startsWith('UPDATE doctors'));

  // search with filters
  const poolSearch = new FakePool([sampleRow()]);
  const repoSearch = new SqlDoctorRepository(poolSearch);
  const list = await repoSearch.search({ name: 'A', specialization: 'Card' });
  assert.strictEqual(list.length, 1);
  assert.ok(poolSearch.calls[0].text.includes('full_name ILIKE'));
  assert.ok(poolSearch.calls[0].text.includes('specialization ILIKE'));
}

run()
  .then(() => console.log('doctorRepository tests passed'))
  .catch((err) => {
    console.error('doctorRepository tests failed', err);
    process.exit(1);
  });
