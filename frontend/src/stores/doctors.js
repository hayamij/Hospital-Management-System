import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Doctors domain store
export const useDoctorsStore = defineStore('doctors', {
  state: () => ({
    doctors: [],
    schedule: [],
    loading: false,
    error: null,
  }),
  actions: {
    async searchDoctors(query) {
      this.loading = true; this.error = null;
      try {
        const res = await api.searchDoctors({ q: query });
        this.doctors = res?.doctors ?? [];
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async viewDoctorSchedule(doctorId) {
      this.loading = true; this.error = null;
      try {
        const res = await api.viewDoctorSchedule({ doctorId });
        this.schedule = res?.appointments ?? [];
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async updateDoctorProfileAndAvailability(doctorId, profile) {
      this.loading = true; this.error = null;
      try { return await api.updateDoctorProfile({ doctorId, profile, slotsPerDay: profile?.slotsPerDay }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async sendDoctorMessage(patientId, text, doctorId) {
      this.loading = true; this.error = null;
      try {
        const res = await api.sendDoctorMessage({ patientId, content: text, doctorId });
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async manageAppointmentDecision(appointmentId, decision, doctorId) {
      this.loading = true; this.error = null;
      try { return await api.decideAppointment(appointmentId, { decision, doctorId }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async markAppointmentStatus(appointmentId, status, doctorId) {
      this.loading = true; this.error = null;
      try { return await api.markAppointmentStatus(appointmentId, { status, doctorId }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
  },
});
