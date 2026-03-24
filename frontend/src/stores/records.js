import { defineStore } from 'pinia';
import { patientApi, doctorApi } from '../services/api.js';
import { useAuthStore } from './auth.js';

export const useRecordsStore = defineStore('records', {
	state: () => ({
		list: [],
		loading: false,
		error: null,
	}),
	actions: {
		async fetchRecords(filters = {}) {
			const auth = useAuthStore();
			this.loading = true;
			this.error = null;
			try {
				if (auth.role === 'patient') {
					const response = await patientApi.listRecords(auth.token, { ...filters, patientId: auth.userId });
					this.list = response.records || [];
					return response;
				}
				if (auth.role === 'doctor' && filters.patientId) {
					const response = await doctorApi.viewPatientRecords(auth.token, filters.patientId, filters);
					this.list = response.records || [];
					return response;
				}
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async addEntry(patientId, note) {
			const auth = useAuthStore();
			if (auth.role !== 'doctor') return;
			await doctorApi.addVisitNote(auth.token, patientId, { note, doctorId: auth.userId });
			await this.fetchRecords({ patientId });
		},
	},
});
