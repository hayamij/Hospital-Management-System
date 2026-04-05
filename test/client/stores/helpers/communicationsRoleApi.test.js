import { beforeEach, describe, expect, it, vi } from 'vitest';
import { doctorApi, patientApi } from '../../../../client/src/services/api.js';
import { fetchMessagesByRole, sendMessageByRole } from '../../../../client/src/stores/helpers/communicationsRoleApi.js';

describe('communicationsRoleApi helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('routes patient message to patientApi.sendMessage with patient payload shape', async () => {
    const sendPatientSpy = vi.spyOn(patientApi, 'sendMessage').mockResolvedValue({ ok: true });
    const sendDoctorSpy = vi.spyOn(doctorApi, 'sendMessage').mockResolvedValue({ ok: true });

    const sent = await sendMessageByRole({
      role: 'patient',
      token: 'token-patient',
      userId: 'pat-1',
      payload: {
        doctorId: 'doc-1',
        subject: 'Can tu van',
        message: 'Xin lich kham',
      },
    });

    expect(sent).toBe(true);
    expect(sendPatientSpy).toHaveBeenCalledWith('token-patient', {
      patientId: 'pat-1',
      doctorId: 'doc-1',
      subject: 'Can tu van',
      message: 'Xin lich kham',
    });
    expect(sendDoctorSpy).not.toHaveBeenCalled();
  });

  it('routes doctor message to doctorApi.sendMessage with doctor payload shape', async () => {
    const sendPatientSpy = vi.spyOn(patientApi, 'sendMessage').mockResolvedValue({ ok: true });
    const sendDoctorSpy = vi.spyOn(doctorApi, 'sendMessage').mockResolvedValue({ ok: true });

    const sent = await sendMessageByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-2',
      payload: {
        patientId: 'pat-2',
        message: 'Vui long den dung gio',
      },
    });

    expect(sent).toBe(true);
    expect(sendDoctorSpy).toHaveBeenCalledWith('token-doctor', {
      doctorId: 'doc-2',
      patientId: 'pat-2',
      content: 'Vui long den dung gio',
    });
    expect(sendPatientSpy).not.toHaveBeenCalled();
  });

  it('returns false for unsupported role without calling APIs', async () => {
    const sendPatientSpy = vi.spyOn(patientApi, 'sendMessage').mockResolvedValue({ ok: true });
    const sendDoctorSpy = vi.spyOn(doctorApi, 'sendMessage').mockResolvedValue({ ok: true });

    const sent = await sendMessageByRole({
      role: 'admin',
      token: 'token-admin',
      userId: 'adm-1',
      payload: { message: 'ignored' },
    });

    expect(sent).toBe(false);
    expect(sendPatientSpy).not.toHaveBeenCalled();
    expect(sendDoctorSpy).not.toHaveBeenCalled();
  });

  it('routes patient history request to patientApi.listMessages', async () => {
    const listPatientSpy = vi.spyOn(patientApi, 'listMessages').mockResolvedValue({ messages: [] });
    const listDoctorSpy = vi.spyOn(doctorApi, 'listMessages').mockResolvedValue({ messages: [] });

    const response = await fetchMessagesByRole({
      role: 'patient',
      token: 'token-patient',
      userId: 'pat-3',
      filters: { limit: 10 },
    });

    expect(response).toEqual({ messages: [] });
    expect(listPatientSpy).toHaveBeenCalledWith('token-patient', {
      limit: 10,
      patientId: 'pat-3',
    });
    expect(listDoctorSpy).not.toHaveBeenCalled();
  });

  it('routes doctor history request to doctorApi.listMessages', async () => {
    const listPatientSpy = vi.spyOn(patientApi, 'listMessages').mockResolvedValue({ messages: [] });
    const listDoctorSpy = vi.spyOn(doctorApi, 'listMessages').mockResolvedValue({ messages: [{ id: 'm-1' }] });

    const response = await fetchMessagesByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-3',
      filters: { limit: 5, patientId: 'should-be-overridden' },
    });

    expect(response).toEqual({ messages: [{ id: 'm-1' }] });
    expect(listDoctorSpy).toHaveBeenCalledWith('token-doctor', {
      limit: 5,
      patientId: 'should-be-overridden',
      doctorId: 'doc-3',
    });
    expect(listPatientSpy).not.toHaveBeenCalled();
  });

  it('returns null for unsupported role when fetching history', async () => {
    const listPatientSpy = vi.spyOn(patientApi, 'listMessages').mockResolvedValue({ messages: [] });
    const listDoctorSpy = vi.spyOn(doctorApi, 'listMessages').mockResolvedValue({ messages: [] });

    const response = await fetchMessagesByRole({
      role: 'admin',
      token: 'token-admin',
      userId: 'adm-1',
      filters: { limit: 10 },
    });

    expect(response).toBeNull();
    expect(listPatientSpy).not.toHaveBeenCalled();
    expect(listDoctorSpy).not.toHaveBeenCalled();
  });
});
