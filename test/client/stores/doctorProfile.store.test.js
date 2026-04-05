import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../client/src/stores/auth.js';
import { useDoctorProfileStore } from '../../../client/src/stores/doctorProfile.js';
import { doctorApi } from '../../../client/src/services/api.js';

const setupDoctorAuth = () => {
  const auth = useAuthStore();
  auth.role = 'doctor';
  auth.token = 'token-doctor';
  auth.userProfile = {
    id: 'doc-1',
    name: 'Dr. Auth',
  };
  return auth;
};

describe('doctorProfile store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('loads doctor profile from API and autofills form + snapshot', async () => {
    setupDoctorAuth();
    const store = useDoctorProfileStore();

    const getProfileSpy = vi.spyOn(doctorApi, 'getProfile').mockResolvedValue({
      doctorId: 'doc-1',
      fullName: 'Dr. Demo',
      specialization: 'Cardiology',
      department: 'Heart Center',
      status: 'active',
      slotsPerDay: 12,
      updatedAt: '2026-04-05T10:00:00.000Z',
    });

    const profile = await store.loadProfile();

    expect(getProfileSpy).toHaveBeenCalledWith('token-doctor', { doctorId: 'doc-1' });
    expect(profile).toMatchObject({
      doctorId: 'doc-1',
      fullName: 'Dr. Demo',
      specialization: 'Cardiology',
      department: 'Heart Center',
      status: 'active',
      slotsPerDay: 12,
    });
    expect(store.form).toMatchObject({
      fullName: 'Dr. Demo',
      specialization: 'Cardiology',
      department: 'Heart Center',
      status: 'active',
      slotsPerDay: 12,
    });
    expect(store.lastSaved).toMatchObject({
      doctorId: 'doc-1',
      slotsPerDay: 12,
    });
  });

  it('updates doctor profile then reloads persisted data from API', async () => {
    setupDoctorAuth();
    const store = useDoctorProfileStore();
    store.form.fullName = 'Dr. New Name';
    store.form.specialization = 'Neurology';
    store.form.department = 'Neuro Clinic';
    store.form.status = 'on_leave';
    store.form.slotsPerDay = 8;

    const updateSpy = vi.spyOn(doctorApi, 'updateProfile').mockResolvedValue({
      doctorId: 'doc-1',
      profile: {
        fullName: 'Dr. New Name',
        specialization: 'Neurology',
        department: 'Neuro Clinic',
        status: 'on_leave',
      },
      slotsPerDay: 8,
    });

    const getProfileSpy = vi.spyOn(doctorApi, 'getProfile').mockResolvedValue({
      doctorId: 'doc-1',
      fullName: 'Dr. New Name (DB)',
      specialization: 'Neurology',
      department: 'Neuro Clinic',
      status: 'on_leave',
      slotsPerDay: 9,
      updatedAt: '2026-04-05T11:30:00.000Z',
    });

    await store.updateProfile();

    expect(updateSpy).toHaveBeenCalledWith('token-doctor', {
      doctorId: 'doc-1',
      profile: {
        fullName: 'Dr. New Name',
        specialization: 'Neurology',
        department: 'Neuro Clinic',
        status: 'on_leave',
      },
      slotsPerDay: 8,
    });
    expect(getProfileSpy).toHaveBeenCalledWith('token-doctor', { doctorId: 'doc-1' });
    expect(store.form).toMatchObject({
      fullName: 'Dr. New Name (DB)',
      specialization: 'Neurology',
      department: 'Neuro Clinic',
      status: 'on_leave',
      slotsPerDay: 9,
    });
    expect(store.lastSaved.doctorId).toBe('doc-1');
    expect(store.lastSaved.slotsPerDay).toBe(9);
    expect(store.success).toBe('Cập nhật hồ sơ bác sĩ thành công.');
  });

  it('restores defaults from lastSaved snapshot before falling back to auth profile', () => {
    const auth = setupDoctorAuth();
    const store = useDoctorProfileStore();

    store.lastSaved.doctorId = 'doc-1';
    store.lastSaved.profile = {
      fullName: 'Dr. Snapshot',
      specialization: 'Dermatology',
      department: 'Skin Clinic',
      status: 'inactive',
      updatedAt: '2026-04-05T12:00:00.000Z',
    };
    store.lastSaved.slotsPerDay = 4;

    store.restoreDefaults();

    expect(store.form).toMatchObject({
      fullName: 'Dr. Snapshot',
      specialization: 'Dermatology',
      department: 'Skin Clinic',
      status: 'inactive',
      slotsPerDay: 4,
    });

    store.lastSaved.profile = null;
    store.lastSaved.slotsPerDay = null;
    auth.userProfile.name = 'Dr. Fallback';

    store.restoreDefaults();

    expect(store.form).toMatchObject({
      fullName: 'Dr. Fallback',
      specialization: '',
      department: '',
      status: 'active',
      slotsPerDay: 0,
    });
  });

  it('returns null when non-doctor role tries to load profile', async () => {
    const auth = useAuthStore();
    auth.role = 'patient';
    auth.token = 'token-patient';
    auth.userProfile = { id: 'pat-1', name: 'Patient A' };

    const store = useDoctorProfileStore();
    const getProfileSpy = vi.spyOn(doctorApi, 'getProfile').mockResolvedValue({});

    const result = await store.loadProfile();

    expect(result).toBeNull();
    expect(getProfileSpy).not.toHaveBeenCalled();
  });
});
