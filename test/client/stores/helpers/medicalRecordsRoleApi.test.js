import { beforeEach, describe, expect, it, vi } from 'vitest';
import { doctorApi, patientApi } from '../../../../client/src/services/api.js';
import {
  addVisitNoteByRole,
  fetchRecordsByRole,
} from '../../../../client/src/stores/helpers/medicalRecordsRoleApi.js';

describe('medicalRecordsRoleApi helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches records for patient role and injects patientId', async () => {
    const payload = { records: [{ id: 'rec-1' }] };
    const listRecordsSpy = vi.spyOn(patientApi, 'listRecords').mockResolvedValue(payload);

    const response = await fetchRecordsByRole({
      role: 'patient',
      token: 'token-patient',
      userId: 'pat-1',
      filters: { page: 1 },
    });

    expect(listRecordsSpy).toHaveBeenCalledWith('token-patient', {
      page: 1,
      patientId: 'pat-1',
    });
    expect(response).toEqual(payload);
  });

  it('fetches records for doctor role when patientId is provided', async () => {
    const payload = { records: [{ id: 'rec-2' }] };
    const viewChartSpy = vi.spyOn(doctorApi, 'viewPatientRecords').mockResolvedValue(payload);

    const response = await fetchRecordsByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-1',
      filters: { patientId: 'pat-2', page: 2 },
    });

    expect(viewChartSpy).toHaveBeenCalledWith('token-doctor', 'pat-2', {
      patientId: 'pat-2',
      page: 2,
    });
    expect(response).toEqual(payload);
  });

  it('returns null for doctor role without patientId', async () => {
    const viewChartSpy = vi.spyOn(doctorApi, 'viewPatientRecords').mockResolvedValue({ records: [] });

    const response = await fetchRecordsByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-1',
      filters: {},
    });

    expect(response).toBeNull();
    expect(viewChartSpy).not.toHaveBeenCalled();
  });

  it('returns null for unsupported role in records fetch', async () => {
    const listRecordsSpy = vi.spyOn(patientApi, 'listRecords').mockResolvedValue({ records: [] });

    const response = await fetchRecordsByRole({
      role: 'admin',
      token: 'token-admin',
      userId: 'adm-1',
      filters: {},
    });

    expect(response).toBeNull();
    expect(listRecordsSpy).not.toHaveBeenCalled();
  });

  it('adds visit note for doctor role', async () => {
    const addVisitNoteSpy = vi.spyOn(doctorApi, 'addVisitNote').mockResolvedValue({ ok: true });

    const updated = await addVisitNoteByRole({
      role: 'doctor',
      token: 'token-doctor',
      userId: 'doc-9',
      patientId: 'pat-9',
      note: 'Theo doi sat',
    });

    expect(updated).toBe(true);
    expect(addVisitNoteSpy).toHaveBeenCalledWith('token-doctor', 'pat-9', {
      note: 'Theo doi sat',
      doctorId: 'doc-9',
    });
  });

  it('does not add visit note for non-doctor role', async () => {
    const addVisitNoteSpy = vi.spyOn(doctorApi, 'addVisitNote').mockResolvedValue({ ok: true });

    const updated = await addVisitNoteByRole({
      role: 'patient',
      token: 'token-patient',
      userId: 'pat-9',
      patientId: 'pat-9',
      note: 'No-op',
    });

    expect(updated).toBe(false);
    expect(addVisitNoteSpy).not.toHaveBeenCalled();
  });
});
