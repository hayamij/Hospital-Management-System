import { defineStore } from 'pinia';
import { patientApi, doctorApi } from '../services/api.js';
import { useAuthStore } from './auth.js';

export const usePatientsStore = defineStore('patients', {
	state: () => ({
		profile: null,
		records: [],
		loading: false,
		error: null,
	}),
	actions: {
		async updateProfile(payload) {
			const auth = useAuthStore();
			if (auth.role !== 'patient') return;
			this.loading = true;
			this.error = null;
			try {
				const response = await patientApi.updateProfile(auth.token, { ...payload, patientId: auth.userId });
				this.profile = { ...(this.profile || {}), ...payload };
				return response;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async loadRecords(filters = {}) {
			const auth = useAuthStore();
			this.loading = true;
			this.error = null;
			try {
				if (auth.role === 'patient') {
					const response = await patientApi.listRecords(auth.token, { ...filters, patientId: auth.userId });
					this.records = response.records || [];
					return response;
				}
				if (auth.role === 'doctor' && filters.patientId) {
					const response = await doctorApi.viewPatientRecords(auth.token, filters.patientId, filters);
					this.records = response.records || [];
					return response;
				}
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async addVisitNote(patientId, note) {
			const auth = useAuthStore();
			if (auth.role !== 'doctor') return;
			await doctorApi.addVisitNote(auth.token, patientId, { note, doctorId: auth.userId });
			await this.loadRecords({ patientId });
		},
	},
});
