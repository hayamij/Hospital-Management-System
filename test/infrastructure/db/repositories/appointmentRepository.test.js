import assert from 'node:assert';
import { SqlAppointmentRepository } from '../../../../server/infrastructure/db/repositories/appointmentRepository.js';
import { wrapLegacyRun } from 'legacyTestHarness';

class FakePool {
  constructor(rows = []) { this.rows = rows; this.calls = []; }
  async query(text, params) { this.calls.push({ text, params }); return { rows: this.rows }; }
}

function sampleRow() {
  return {
    id: 'a1',
    patient_id: 'p1',
    doctor_id: 'd1',
    start_at: new Date('2025-01-01T10:00:00Z'),
    end_at: new Date('2025-01-01T11:00:00Z'),
    reason: 'Check',
    status: 'pending',
    created_at: new Date('2025-01-01T00:00:00Z'),
    updated_at: new Date('2025-01-01T00:00:00Z'),
  };
}

async function run() {
  // findById
  const poolFind = new FakePool([sampleRow()]);
  const repoFind = new SqlAppointmentRepository(poolFind);
  const found = await repoFind.findById('a1');
  assert.strictEqual(found.id, 'a1');
  assert.strictEqual(found.patientId, 'p1');

  // save insert
  const poolInsert = new FakePool([sampleRow()]);
  const repoInsert = new SqlAppointmentRepository(poolInsert);
  const created = await repoInsert.save({ patientId: 'p1', doctorId: 'd1', startAt: new Date('2025-01-01T10:00:00Z'), endAt: new Date('2025-01-01T11:00:00Z'), reason: 'Check', status: 'pending' });
  assert.strictEqual(created.id, 'a1');
  assert.ok(poolInsert.calls.some((c) => c.text.includes('INSERT INTO appointments') || c.text.startsWith('UPDATE appointments')));

  // save update
  const poolUpdate = new FakePool([sampleRow()]);
  const repoUpdate = new SqlAppointmentRepository(poolUpdate);
  await repoUpdate.save({ id: 'a1', patientId: 'p1', doctorId: 'd1', startAt: new Date(), endAt: new Date(Date.now() + 3600_000), reason: 'Updated', status: 'pending' });
  assert.ok(poolUpdate.calls.some((c) => c.text.startsWith('UPDATE appointments')));

  // listByDoctor filters
  const poolList = new FakePool([sampleRow()]);
  const repoList = new SqlAppointmentRepository(poolList);
  const byDoc = await repoList.listByDoctor('d1', { from: new Date('2025-01-01'), to: new Date('2025-01-02') });
  assert.strictEqual(byDoc.length, 1);
  assert.ok(poolList.calls[0].text.includes('doctor_id = $1'));
  assert.ok(poolList.calls[0].text.includes('start_at >='));

  // listByPatient
  const poolPat = new FakePool([sampleRow()]);
  const repoPat = new SqlAppointmentRepository(poolPat);
  const byPat = await repoPat.listByPatient('p1');
  assert.strictEqual(byPat[0].doctorId, 'd1');

  // listAvailableSlots delegates
  const poolSlot = new FakePool([sampleRow()]);
  const repoSlot = new SqlAppointmentRepository(poolSlot);
  await repoSlot.listAvailableSlots('d1');
  assert.ok(poolSlot.calls[0].text.includes('doctor_id'));

  // listAvailableSlots uses full-day boundaries for date filters
  {
    const repoRange = new SqlAppointmentRepository(new FakePool([]));
    let captured = null;
    repoRange.listByDoctor = async (doctorId, filters) => {
      captured = { doctorId, filters };
      return [];
    };

    await repoRange.listAvailableSlots('d1', {
      from: new Date('2025-01-01T00:00:00Z'),
      to: new Date('2025-01-01T00:00:00Z'),
    });

    assert.strictEqual(captured.doctorId, 'd1');
    assert.strictEqual(captured.filters.from.toISOString(), '2025-01-01T00:00:00.000Z');
    assert.strictEqual(captured.filters.to.toISOString(), '2025-01-01T23:59:59.999Z');
  }

  // Scheduled appointments block overlapping slots
  {
    const repoBusy = new SqlAppointmentRepository(new FakePool([]));
    repoBusy.listByDoctor = async () => [
      {
        startAt: new Date('2025-01-01T08:00:00.000Z'),
        endAt: new Date('2025-01-01T08:30:00.000Z'),
        status: 'scheduled',
      },
    ];

    const slots = await repoBusy.listAvailableSlots('d1', {
      from: new Date('2025-01-01T00:00:00.000Z'),
      to: new Date('2025-01-01T00:00:00.000Z'),
    });

    assert.ok(!slots.some((slot) => slot.start === '2025-01-01T08:00:00.000Z'));
  }
}

wrapLegacyRun(run, 'appointmentRepository');

