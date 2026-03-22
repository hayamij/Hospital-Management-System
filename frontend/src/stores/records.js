import { defineStore } from 'pinia';
import * as api from '../services/api.js';

// Medical records store
export const useRecordsStore = defineStore('records', {
  state: () => ({
    records: [],
    loading: false,
    error: null,
  }),
  actions: {
    async viewMedicalRecords(patientId) {
      this.loading = true; this.error = null;
      try {
        const res = await api.viewMedicalRecords({ patientId });
        this.records = res?.records ?? [];
        return res;
      } catch (err) { this.error = err; throw err; } finally { this.loading = false; }
    },
    async addVisitNote(patientId, note, doctorId) {
      this.loading = true; this.error = null;
      try { return await api.addVisitNote(patientId, { patientId, doctorId, note }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async reviewTestResults(labResultId, notes, doctorId) {
      this.loading = true; this.error = null;
      try { return await api.reviewTestResults(labResultId, { notes, doctorId }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async updateMedicalRecordEntry(recordId, entry, doctorId) {
      this.loading = true; this.error = null;
      try { return await api.updateMedicalRecordEntry(recordId, { note: entry, doctorId }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async auditMedicalRecords(recordId, payload) {
      this.loading = true; this.error = null;
      try { return await api.auditRecord(recordId, payload); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
    async accessPatientChart(patientId, doctorId) {
      this.loading = true; this.error = null;
      try { return await api.accessPatientChart({ patientId, doctorId }); }
      catch (err) { this.error = err; throw err; }
      finally { this.loading = false; }
    },
  },
});
