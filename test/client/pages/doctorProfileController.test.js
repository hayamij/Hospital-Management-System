import { describe, expect, it, vi } from 'vitest';
import {
  createDoctorProfilePageActions,
  formatDoctorStatus,
} from '../../../client/src/pages/controllers/doctorProfileController.js';

describe('doctorProfileController', () => {
  it('formats doctor status labels for UI display', () => {
    expect(formatDoctorStatus('active')).toBe('Đang hoạt động');
    expect(formatDoctorStatus('on_leave')).toBe('Đang nghỉ phép');
    expect(formatDoctorStatus('inactive')).toBe('Ngưng hoạt động');
    expect(formatDoctorStatus('other')).toBe('other');
    expect(formatDoctorStatus('')).toBe('-');
  });

  it('initializes page by fetching user then loading profile', async () => {
    const auth = { fetchCurrentUser: vi.fn().mockResolvedValue({ id: 'doc-1' }) };
    const doctorProfile = {
      loadProfile: vi.fn().mockResolvedValue({ doctorId: 'doc-1' }),
      restoreDefaults: vi.fn(),
      updateProfile: vi.fn(),
    };

    const actions = createDoctorProfilePageActions({ auth, doctorProfile });
    await actions.initializePage();

    expect(auth.fetchCurrentUser).toHaveBeenCalledTimes(1);
    expect(doctorProfile.loadProfile).toHaveBeenCalledTimes(1);
    expect(doctorProfile.restoreDefaults).not.toHaveBeenCalled();
  });

  it('falls back to restoreDefaults when profile reload fails', async () => {
    const auth = { fetchCurrentUser: vi.fn().mockResolvedValue({ id: 'doc-1' }) };
    const doctorProfile = {
      loadProfile: vi.fn().mockRejectedValue(new Error('network failed')),
      restoreDefaults: vi.fn(),
      updateProfile: vi.fn(),
    };

    const actions = createDoctorProfilePageActions({ auth, doctorProfile });
    await actions.reloadProfile();

    expect(doctorProfile.loadProfile).toHaveBeenCalledTimes(1);
    expect(doctorProfile.restoreDefaults).toHaveBeenCalledTimes(1);
  });

  it('delegates save and restore actions without throwing on save error', async () => {
    const auth = { fetchCurrentUser: vi.fn().mockResolvedValue({ id: 'doc-1' }) };
    const doctorProfile = {
      loadProfile: vi.fn().mockResolvedValue({ doctorId: 'doc-1' }),
      restoreDefaults: vi.fn(),
      updateProfile: vi.fn().mockRejectedValue(new Error('save failed')),
    };

    const actions = createDoctorProfilePageActions({ auth, doctorProfile });

    actions.restoreDefaults();
    expect(doctorProfile.restoreDefaults).toHaveBeenCalledTimes(1);

    await expect(actions.submitProfile()).resolves.toBeUndefined();
    expect(doctorProfile.updateProfile).toHaveBeenCalledTimes(1);
  });
});
