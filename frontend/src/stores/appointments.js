import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Appointments domain store: isolates appointment workflows from UI components
export const useAppointmentsStore = defineStore('appointments', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async scheduleAppointment(input) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.scheduleAppointment(input);
        this.items.push({
          id: res.appointmentId,
          patientId: input.patientId,
          doctorId: input.doctorId,
          startAt: res.startAt ?? input.startAt,
          endAt: res.endAt ?? input.endAt,
          status: res.status ?? 'scheduled',
        });
        return res;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async rescheduleAppointment(appointmentId, startAt, endAt) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.rescheduleAppointment(appointmentId, { startAt, endAt });
        const found = this.items.find((a) => a.id === appointmentId);
        if (found) {
          found.startAt = res.startAt ?? startAt;
          found.endAt = res.endAt ?? endAt;
          if (res.status) found.status = res.status;
        }
        return res;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async cancelAppointment(appointmentId, patientId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.cancelAppointment(appointmentId, { patientId });
        const found = this.items.find((a) => a.id === appointmentId);
        if (found) found.status = res.status ?? 'cancelled';
        return res;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async manageAppointmentDecision(appointmentId, decision, doctorId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.decideAppointment(appointmentId, { decision, doctorId });
        // Refresh list after decision
        await this.viewAppointments({ doctorId });
        return res;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async viewAppointments(filter = {}) {
      this.loading = true;
      this.error = null;
      try {
        const res = await api.viewAppointments(filter);
        this.items = res?.appointments ?? [];
        return res;
      } catch (err) {
        this.error = err;
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
