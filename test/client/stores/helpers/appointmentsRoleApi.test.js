import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminApi, doctorApi, patientApi } from '../../../../client/src/services/api.js';
import {
  fetchAppointmentsByRole,
  updateAppointmentStatusByRole,
} from '../../../../client/src/stores/helpers/appointmentsRoleApi.js';

describe('appointmentsRoleApi helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches patient appointments and maps pagination', async () => {
    const payload = {
      appointments: [{ id: 'apt-1' }],
      total: 4,
      page: 2,
      pageSize: 5,
    };
    const listAppointmentsSpy = vi.spyOn(patientApi, 'listAppointments').mockResolvedValue(payload);

    const result = await fetchAppointmentsByRole({
      role: 'patient',
      token: 'token-patient',
      userId: 'pat-1',
      filters: { status: 'pending', page: 2 },
      page: 1,
      pageSize: 10,
    });

    expect(listAppointmentsSpy).toHaveBeenCalledWith('token-patient', {
      status: 'pending',
      page: 2,
      pageSize: 10,
      patientId: 'pat-1',
    });
    expect(result).toEqual({
      response: payload,
      items: payload.appointments,
      total: 4,
      page: 2,
      pageSize: 5,
    });
  });

  it('fetches doctor schedule and maps pagination', async () => {
    const payload = {
      appointments: [{ id: 'apt-2' }],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    const getScheduleSpy = vi.spyOn(doctorApi, 'getSchedule').mockResolvedValue(payload);

    const result = await fetchAppointmentsByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-1',
      filters: { status: 'scheduled' },
      page: 1,
      pageSize: 10,
    });

    expect(getScheduleSpy).toHaveBeenCalledWith('token-doctor', {
      status: 'scheduled',
      page: 1,
      pageSize: 10,
      doctorId: 'doc-1',
    });
    expect(result).toEqual({
      response: payload,
      items: payload.appointments,
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('fetches admin appointments and maps pagination', async () => {
    const payload = {
      appointments: [{ id: 'apt-3' }],
      total: 12,
      page: 2,
      pageSize: 10,
    };
    const listAdminAppointmentsSpy = vi.spyOn(adminApi, 'listAppointments').mockResolvedValue(payload);

    const result = await fetchAppointmentsByRole({
      role: 'admin',
      token: 'token-admin',
      userId: 'adm-1',
      filters: { status: 'pending', page: 2 },
      page: 1,
      pageSize: 10,
    });

    expect(listAdminAppointmentsSpy).toHaveBeenCalledWith('token-admin', {
      status: 'pending',
      page: 2,
      pageSize: 10,
    });
    expect(result).toEqual({
      response: payload,
      items: payload.appointments,
      total: 12,
      page: 2,
      pageSize: 10,
    });
  });

  it('returns null when role is unsupported for appointment listing', async () => {
    const listAppointmentsSpy = vi.spyOn(patientApi, 'listAppointments').mockResolvedValue({});
    const getScheduleSpy = vi.spyOn(doctorApi, 'getSchedule').mockResolvedValue({});
    const listAdminAppointmentsSpy = vi.spyOn(adminApi, 'listAppointments').mockResolvedValue({});

    const result = await fetchAppointmentsByRole({ role: 'guest', token: 'token-guest', userId: 'gst-1' });

    expect(result).toBeNull();
    expect(listAppointmentsSpy).not.toHaveBeenCalled();
    expect(getScheduleSpy).not.toHaveBeenCalled();
    expect(listAdminAppointmentsSpy).not.toHaveBeenCalled();
  });

  it('routes doctor decision updates to decision API', async () => {
    const decisionResponse = { ok: true };
    const decisionSpy = vi.spyOn(doctorApi, 'updateAppointmentDecision').mockResolvedValue(decisionResponse);
    const statusSpy = vi.spyOn(doctorApi, 'updateAppointmentStatus').mockResolvedValue({ ok: true });

    const updated = await updateAppointmentStatusByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-1',
      appointmentId: 'apt-3',
      payload: { decision: 'accept' },
    });

    expect(updated).toEqual(decisionResponse);
    expect(decisionSpy).toHaveBeenCalledWith('token-doctor', 'apt-3', {
      decision: 'accept',
      doctorId: 'doc-1',
    });
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it('routes doctor status updates to status API', async () => {
    const statusResponse = { ok: true };
    const decisionSpy = vi.spyOn(doctorApi, 'updateAppointmentDecision').mockResolvedValue({ ok: true });
    const statusSpy = vi.spyOn(doctorApi, 'updateAppointmentStatus').mockResolvedValue(statusResponse);

    const updated = await updateAppointmentStatusByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-2',
      appointmentId: 'apt-4',
      payload: { status: 'completed' },
    });

    expect(updated).toEqual(statusResponse);
    expect(statusSpy).toHaveBeenCalledWith('token-doctor', 'apt-4', {
      status: 'completed',
      doctorId: 'doc-2',
    });
    expect(decisionSpy).not.toHaveBeenCalled();
  });

  it('routes admin updates to override endpoint', async () => {
    const overrideResponse = { ok: true };
    const overrideSpy = vi.spyOn(adminApi, 'overrideAppointment').mockResolvedValue(overrideResponse);

    const updated = await updateAppointmentStatusByRole({
      role: 'admin',
      token: 'token-admin',
      userId: 'adm-2',
      appointmentId: 'apt-5',
      payload: { status: 'cancelled' },
    });

    expect(updated).toEqual(overrideResponse);
    expect(overrideSpy).toHaveBeenCalledWith('token-admin', 'apt-5', { status: 'cancelled' });
  });

  it('returns false for unsupported role in update flow', async () => {
    const overrideSpy = vi.spyOn(adminApi, 'overrideAppointment').mockResolvedValue({ ok: true });

    const updated = await updateAppointmentStatusByRole({
      role: 'patient',
      token: 'token-patient',
      userId: 'pat-2',
      appointmentId: 'apt-6',
      payload: { status: 'cancelled' },
    });

    expect(updated).toBe(false);
    expect(overrideSpy).not.toHaveBeenCalled();
  });
});
