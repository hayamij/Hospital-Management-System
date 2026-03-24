import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../../../frontend/src/services/api.js', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
  },
  patientApi: {
    listAppointments: vi.fn(),
    scheduleAppointment: vi.fn(),
    rescheduleAppointment: vi.fn(),
    cancelAppointment: vi.fn(),
    listBilling: vi.fn(),
  },
  doctorApi: {
    getSchedule: vi.fn(),
    updateAppointmentDecision: vi.fn(),
    updateAppointmentStatus: vi.fn(),
  },
  adminApi: {
    overrideAppointment: vi.fn(),
    manageBilling: vi.fn(),
    listUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

import { authApi, patientApi, doctorApi, adminApi } from '../../../frontend/src/services/api.js';
import { useAuthStore } from '../../../frontend/src/stores/auth.js';
import { useAppointmentsStore } from '../../../frontend/src/stores/appointments.js';
import { useBillingStore } from '../../../frontend/src/stores/billing.js';
import { useAdminUsersStore } from '../../../frontend/src/stores/adminUsers.js';

const makeStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
};

describe('frontend store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    const storage = makeStorage();
    globalThis.localStorage = storage;

    vi.clearAllMocks();
  });

  it('auth login hydrates session state', async () => {
    authApi.login.mockResolvedValue({
      userId: 'pat-1',
      role: 'patient',
      email: 'patient@example.com',
      token: 'token-1',
    });

    const auth = useAuthStore();
    await auth.login({ identifier: 'patient@example.com', password: 'secret' });

    expect(auth.token).toBe('token-1');
    expect(auth.role).toBe('patient');
    expect(auth.userProfile?.id).toBe('pat-1');
    expect(authApi.login).toHaveBeenCalledTimes(1);
  });

  it('appointments store uses schedule and decision endpoints by role', async () => {
    const auth = useAuthStore();
    auth.token = 'patient-token';
    auth.role = 'patient';
    auth.userProfile = { id: 'pat-1', email: 'pat@example.com' };

    patientApi.scheduleAppointment.mockResolvedValue({ appointmentId: 'apt-1' });
    patientApi.listAppointments.mockResolvedValue({ page: 1, pageSize: 10, total: 1, appointments: [{ id: 'apt-1', status: 'pending' }] });

    const appointments = useAppointmentsStore();
    await appointments.schedule({ doctorId: 'doc-1', startAt: '2026-04-01T10:00:00Z', endAt: '2026-04-01T10:30:00Z', reason: 'checkup' });

    expect(patientApi.scheduleAppointment).toHaveBeenCalledTimes(1);
    expect(patientApi.listAppointments).toHaveBeenCalledTimes(1);

    auth.role = 'doctor';
    auth.userProfile = { id: 'doc-1', email: 'doc@example.com' };
    doctorApi.updateAppointmentDecision.mockResolvedValue({ appointmentId: 'apt-1', status: 'accepted' });
    doctorApi.getSchedule.mockResolvedValue({ page: 1, pageSize: 10, total: 1, appointments: [{ id: 'apt-1' }] });

    await appointments.updateStatus('apt-1', { decision: 'accepted' });

    expect(doctorApi.updateAppointmentDecision).toHaveBeenCalledTimes(1);
    expect(doctorApi.getSchedule).toHaveBeenCalledTimes(1);
  });

  it('billing store supports patient fetch and admin billing action', async () => {
    const auth = useAuthStore();
    auth.token = 'token';
    auth.userProfile = { id: 'pat-1' };

    const billing = useBillingStore();

    auth.role = 'patient';
    patientApi.listBilling.mockResolvedValue({ page: 1, pageSize: 10, total: 1, billings: [{ id: 'inv-1' }], payments: [] });
    await billing.fetchBilling({});

    expect(billing.invoices.length).toBe(1);
    expect(patientApi.listBilling).toHaveBeenCalledTimes(1);

    auth.role = 'admin';
    adminApi.manageBilling.mockResolvedValue({ invoiceId: 'inv-1', status: 'paid' });
    patientApi.listBilling.mockClear();
    await billing.manageInvoice('inv-1', { action: 'markPaid' });

    expect(adminApi.manageBilling).toHaveBeenCalledTimes(1);
    expect(patientApi.listBilling).toHaveBeenCalledTimes(0);
  });

  it('admin users store performs list, create and update', async () => {
    const auth = useAuthStore();
    auth.token = 'admin-token';
    auth.role = 'admin';
    auth.userProfile = { id: 'admin-1' };

    adminApi.listUsers.mockResolvedValue({
      page: 1,
      pageSize: 10,
      total: 1,
      users: [{ id: 'u-1', fullName: 'User One', email: 'u1@example.com', role: 'patient', status: 'active' }],
    });
    adminApi.createUser.mockResolvedValue({ userId: 'u-2' });
    adminApi.updateUser.mockResolvedValue({ userId: 'u-1' });

    const users = useAdminUsersStore();
    await users.fetchUsers({ page: 1, pageSize: 10 });
    await users.createUser({ fullName: 'User Two', email: 'u2@example.com', role: 'doctor', status: 'active' });
    await users.updateUser('u-1', { fullName: 'User One Updated', email: 'u1@example.com', role: 'patient', status: 'active' });

    expect(adminApi.listUsers).toHaveBeenCalled();
    expect(adminApi.createUser).toHaveBeenCalledTimes(1);
    expect(adminApi.updateUser).toHaveBeenCalledTimes(1);
    expect(users.users.length).toBeGreaterThan(0);
  });
});
