import { describe, expect, it } from 'vitest';
import { mapDoctorScheduleItems } from '../../../client/src/pages/controllers/doctor/doctorLabResultsController.js';

describe('doctorLabResultsController', () => {
  it('maps appointment list into UI-friendly schedule items', () => {
    const rows = mapDoctorScheduleItems([
      {
        appointmentId: 'apt-1',
        patient: { id: 'pat-1' },
        reason: 'Tái khám',
        startAt: '2026-04-01T08:00:00Z',
        endAt: '2026-04-01T08:30:00Z',
        status: 'scheduled',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: 'apt-1',
      patientId: 'pat-1',
      reason: 'Tái khám',
      startAt: '2026-04-01T08:00:00Z',
      endAt: '2026-04-01T08:30:00Z',
      status: 'scheduled',
    });
  });

  it('fills defaults when appointment fields are missing', () => {
    const rows = mapDoctorScheduleItems([{}]);

    expect(rows[0].id).toBe('appointment-1');
    expect(rows[0].patientId).toBe('');
    expect(rows[0].reason).toBe('Lịch khám');
    expect(rows[0].startAt).toBe('-');
    expect(rows[0].endAt).toBe('-');
    expect(rows[0].status).toBe('-');
  });
});
