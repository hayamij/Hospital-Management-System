import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../index.js';
import { makeDeps, expectJson } from './mockDeps.js';

const appWith = (overrides = {}) => buildApp(makeDeps(overrides));

describe('HTTP adapters smoke', () => {
  it('patient: schedule appointment maps view model and returns 201', async () => {
    const app = appWith();
    const res = await request(app)
      .post('/api/patients/appointments')
      .send({ startAt: '2026-04-01T10:00:00Z', endAt: '2026-04-01T10:30:00Z' })
      .expect(201);

    const data = expectJson(res);
    expect(data).toEqual({
      appointmentId: 'apt-1',
      status: 'scheduled',
      startAt: '2026-04-01T10:00:00Z',
      endAt: '2026-04-01T10:30:00Z',
    });
  });

  it('patient: download prescription maps file/filename', async () => {
    const app = appWith();
    const res = await request(app)
      .get('/api/patients/prescriptions/rx-1/download')
      .expect(200);

    const data = expectJson(res);
    expect(data).toEqual({ prescriptionId: 'rx-1', file: 'PDFDATA', filename: 'rx.pdf' });
  });

  it('doctor: update profile returns view model', async () => {
    const app = appWith();
    const res = await request(app)
      .put('/api/doctors/profile')
      .send({ profile: { bio: 'hello' } })
      .expect(200);

    const data = expectJson(res);
    expect(data.doctorId).toBe('doc-1');
    expect(data.updatedAt).toBeTruthy();
  });

  it('doctor: schedule view returns paged appointments', async () => {
    const app = appWith();
    const res = await request(app)
      .get('/api/doctors/schedule')
      .expect(200);

    const data = expectJson(res);
    expect(data).toEqual({ page: 1, pageSize: 10, total: 0, appointments: [] });
  });

  it('admin: override appointment uses view model', async () => {
    const app = appWith();
    const res = await request(app)
      .post('/api/admin/appointments/apt-1/override')
      .send({ action: 'reschedule', startAt: '2026-04-02', endAt: '2026-04-02' })
      .expect(200);

    const data = expectJson(res);
    expect(data.appointmentId).toBe('apt-1');
    expect(data.status).toBe('overridden');
  });

  it('guest: browse public info returns ok', async () => {
    const app = appWith();
    const res = await request(app)
      .get('/api/guests/public-info')
      .expect(200);

    const data = expectJson(res);
    expect(data.ok).toBe(true);
  });

  it('auth: login maps to LoginViewModel', async () => {
    const app = appWith();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x', password: 'y' })
      .expect(200);

    const data = expectJson(res);
    expect(data).toEqual({ userId: 'user-1', token: 'token-user', role: 'patient' });
  });
});
