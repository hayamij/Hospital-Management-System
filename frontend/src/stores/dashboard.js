import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Dashboard aggregate store: pulls summary metrics and last report
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: { patients: 0, doctors: 0, appointments: 0, revenue: 0 },
    lastReport: null,
    loading: false,
    error: null,
  }),
  actions: {
    async runReport(params = {}) {
      this.loading = true; this.error = null;
      try {
        const res = await api.runReport(params);
        const report = res?.report ?? res;
        this.lastReport = report ?? null;
        const counts = report?.counts ?? report ?? {};
        const totals = report?.totals ?? report ?? {};
        this.stats = {
          patients: counts.patients ?? 0,
          doctors: counts.doctors ?? 0,
          appointments: counts.appointments ?? 0,
          revenue: totals.revenue ?? counts.revenue ?? 0,
        };
        return res;
      } catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    hydrateFromCollections({ patients = [], doctors = [], appointments = [], billing = [] } = {}) {
      this.stats = {
        patients: patients.length,
        doctors: doctors.length,
        appointments: appointments.length,
        revenue: billing.reduce((sum, b) => sum + (b.total ?? 0), 0),
      };
    },
  },
});
