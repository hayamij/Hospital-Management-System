import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Billing store
export const useBillingStore = defineStore('billing', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async viewBillingAndPayments(patientId) {
      this.loading = true; this.error = null;
      try {
        const res = await api.viewBillingAndPayments({ patientId });
        this.items = res?.billings ?? [];
        return res;
      } catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async manageBilling({ invoiceId, action, dueDate, patientId }) {
      this.loading = true; this.error = null;
      try {
        const res = await api.manageBilling(invoiceId ?? 'new', { action, dueDate });
        if (patientId) await this.viewBillingAndPayments(patientId);
        return res;
      } catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async downloadPrescription(prescriptionId, patientId) {
      this.loading = true; this.error = null;
      try {
        return await api.downloadPrescription(prescriptionId, { patientId });
      } catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
  },
});
