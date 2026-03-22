import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Patients domain store
export const usePatientsStore = defineStore('patients', {
  state: () => ({
    patients: [],
    services: [],
    loading: false,
    error: null,
  }),
  actions: {
    async browsePublicInfo() {
      this.loading = true; this.error = null;
      try {
        const res = await api.browsePublicInfo();
        this.services = res?.services ?? res?.items ?? this.services;
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async guestSearchDoctors(params) {
      this.loading = true; this.error = null;
      try {
        const res = await api.guestSearchDoctors(params);
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async startRegistration(payload) {
      this.loading = true; this.error = null;
      try {
        const res = await api.startRegistration(payload);
        this.patients.push({ id: res?.patientId ?? `pat-${Math.random().toString(36).slice(2, 8)}`, name: payload?.name ?? 'New Patient', profile: payload });
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async registerPatientAccount(payload) {
      this.loading = true; this.error = null;
      try {
        const res = await api.registerPatientAccount(payload);
        this.patients.push({ id: res?.patientId ?? `pat-${Math.random().toString(36).slice(2, 8)}`, name: payload?.name ?? 'Patient', profile: payload });
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async updatePatientProfile(patientId, profile) {
      this.loading = true; this.error = null;
      try {
        const res = await api.updatePatientProfile({ patientId, ...profile });
        const patient = this.patients.find((p) => p.id === (res?.patientId ?? patientId));
        if (patient) patient.profile = { ...patient.profile, ...profile };
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async sendPatientMessage(payload) {
      this.loading = true; this.error = null;
      try {
        const res = await api.sendPatientMessage({ patientId: payload.patientId, doctorId: payload.doctorId, subject: payload.subject ?? 'Message', message: payload.text ?? payload.message });
        return res;
      } catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
  },
});
