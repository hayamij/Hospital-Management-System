import { beforeEach, describe, expect, it, vi } from 'vitest';
import { guestApi, patientApi } from '../../../../client/src/services/api.js';
import {
  mapDoctorsSearchResult,
  searchDoctorsByAuth,
} from '../../../../client/src/stores/helpers/doctorsSearchApi.js';

describe('doctorsSearchApi helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses patientApi when user is authenticated', async () => {
    const patientSpy = vi.spyOn(patientApi, 'searchDoctors').mockResolvedValue({ doctors: [], total: 0 });
    const guestSpy = vi.spyOn(guestApi, 'searchDoctors').mockResolvedValue({ doctors: [], total: 0 });

    await searchDoctorsByAuth({
      isAuthenticated: true,
      filters: { query: 'tim mach', specialty: 'Tim mạch', page: 1, pageSize: 5 },
    });

    expect(patientSpy).toHaveBeenCalledWith({
      query: 'tim mach',
      specialty: 'Tim mạch',
      page: 1,
      pageSize: 5,
    });
    expect(guestSpy).not.toHaveBeenCalled();
  });

  it('uses guestApi when user is not authenticated', async () => {
    const patientSpy = vi.spyOn(patientApi, 'searchDoctors').mockResolvedValue({ doctors: [], total: 0 });
    const guestSpy = vi.spyOn(guestApi, 'searchDoctors').mockResolvedValue({ doctors: [], total: 0 });

    await searchDoctorsByAuth({
      isAuthenticated: false,
      filters: { query: 'nhi', specialty: 'Nhi khoa' },
    });

    expect(guestSpy).toHaveBeenCalledWith({
      query: 'nhi',
      specialty: 'Nhi khoa',
      page: undefined,
      pageSize: undefined,
    });
    expect(patientSpy).not.toHaveBeenCalled();
  });

  it('maps doctors response to normalized list and total', () => {
    const result = mapDoctorsSearchResult({
      doctors: [
        { doctorId: 'doc-1', fullName: 'Dr. A', specialization: 'Noi khoa' },
        { id: 'doc-2', name: 'Dr. B', specialty: 'Nhi khoa' },
      ],
      total: 12,
    });

    expect(result.total).toBe(12);
    expect(result.list).toHaveLength(2);
    expect(result.list[0]).toMatchObject({ id: 'doc-1', name: 'Dr. A', specialty: 'Noi khoa' });
    expect(result.list[1]).toMatchObject({ id: 'doc-2', name: 'Dr. B', specialty: 'Nhi khoa' });
  });

  it('returns empty defaults when payload is missing doctors', () => {
    expect(mapDoctorsSearchResult(null)).toEqual({ list: [], total: 0 });
    expect(mapDoctorsSearchResult({ doctors: null })).toEqual({ list: [], total: 0 });
  });
});
