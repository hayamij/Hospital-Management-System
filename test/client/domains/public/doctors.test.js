import { describe, expect, it } from 'vitest';
import {
  filterDoctors,
  getFallbackDoctors,
  listSpecialties,
  loadDoctorDirectory,
  normalizeDoctor,
} from '../../../../client/src/domains/public/services/doctors.js';

describe('public doctors domain', () => {
  it('normalizes doctor objects for UI', () => {
    const doctor = normalizeDoctor({ doctorId: 'doc-9', fullName: 'Dr. Test', specialization: 'Noi' });
    expect(doctor).toMatchObject({
      id: 'doc-9',
      name: 'Dr. Test',
      specialty: 'Noi',
    });
    expect(doctor.avatar).toContain('ui-avatars.com');
  });

  it('returns fallback doctors when API has no data', async () => {
    const fakeApi = {
      searchDoctors: async () => ({ doctors: [] }),
    };
    const result = await loadDoctorDirectory(fakeApi, { query: '', specialty: '' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('filters by query and specialty', () => {
    const doctors = [
      { id: '1', name: 'Dr. Alice', specialty: 'Tim mach' },
      { id: '2', name: 'Dr. Bob', specialty: 'Nhi khoa' },
    ];
    const result = filterDoctors({ doctors, query: 'alice', specialty: 'Tim mach' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('builds unique sorted specialty list', () => {
    const list = listSpecialties([
      { specialty: 'Nhi khoa' },
      { specialty: 'Tim mach' },
      { specialty: 'Nhi khoa' },
    ]);
    expect(list).toEqual(['Nhi khoa', 'Tim mach']);
  });

  it('exposes deterministic fallback array', () => {
    const doctors = getFallbackDoctors();
    expect(doctors.length).toBeGreaterThan(3);
    expect(doctors.every((item) => item.id && item.name)).toBe(true);
  });
});
