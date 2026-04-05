import { describe, expect, it } from 'vitest';
import {
  canRoleUpdateAppointmentStatus,
  getDoctorPendingAppointments,
} from '../../../client/src/pages/controllers/appointmentsController.js';

describe('appointmentsController', () => {
  it('returns only pending/requested appointments for doctor role', () => {
    const list = [
      { id: 'apt-1', status: 'pending' },
      { id: 'apt-2', status: 'requested' },
      { id: 'apt-3', status: 'scheduled' },
      { id: 'apt-4', status: 'completed' },
    ];

    const result = getDoctorPendingAppointments(list, 'doctor');

    expect(result).toEqual([
      { id: 'apt-1', status: 'pending' },
      { id: 'apt-2', status: 'requested' },
    ]);
  });

  it('returns empty list for non-doctor role', () => {
    const result = getDoctorPendingAppointments([{ id: 'apt-1', status: 'pending' }], 'patient');
    expect(result).toEqual([]);
  });

  it('allows doctor to update scheduled or in_progress status only', () => {
    expect(canRoleUpdateAppointmentStatus({ status: 'scheduled' }, 'doctor')).toBe(true);
    expect(canRoleUpdateAppointmentStatus({ status: 'in_progress' }, 'doctor')).toBe(true);
    expect(canRoleUpdateAppointmentStatus({ status: 'pending' }, 'doctor')).toBe(false);
    expect(canRoleUpdateAppointmentStatus({ status: 'completed' }, 'doctor')).toBe(false);
  });

  it('disallows status update for non-doctor role', () => {
    expect(canRoleUpdateAppointmentStatus({ status: 'scheduled' }, 'patient')).toBe(false);
    expect(canRoleUpdateAppointmentStatus({ status: 'scheduled' }, 'admin')).toBe(false);
  });
});
