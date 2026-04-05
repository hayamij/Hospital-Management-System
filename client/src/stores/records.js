import { defineStore } from 'pinia';
import { useAuthStore } from './auth.js';
import {
	addVisitNoteByRole,
	createMedicalRecordByRole,
	fetchRecordsByRole,
} from './helpers/medicalRecordsRoleApi.js';

export const useRecordsStore = defineStore('records', {
	state: () => ({
		list: [],
		loading: false,
		error: null,
	}),
	actions: {
		toRecordList(response) {
			if (Array.isArray(response?.records)) return response.records;
			if (Array.isArray(response?.entries)) return response.entries;
			return [];
		},
		async fetchRecords(filters = {}) {
			const auth = useAuthStore();
			this.loading = true;
			this.error = null;
			try {
				const response = await fetchRecordsByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					filters,
				});
				this.list = this.toRecordList(response);
				return response;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async addEntry(patientId, note) {
			const auth = useAuthStore();
			this.error = null;
			try {
				const updated = await addVisitNoteByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					patientId,
					note,
				});
				if (!updated) return;
				await this.fetchRecords({ patientId });
			} catch (error) {
				this.error = error.message;
				throw error;
			}
		},
		async createRecord(patientId) {
			const auth = useAuthStore();
			const normalizedPatientId = String(patientId || '').trim();
			if (!normalizedPatientId) {
				this.error = 'Patient id is required.';
				return null;
			}

			this.error = null;
			try {
				const result = await createMedicalRecordByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					patientId: normalizedPatientId,
				});

				if (!result) return null;
				await this.fetchRecords({ patientId: normalizedPatientId });
				return result;
			} catch (error) {
				this.error = error.message;
				throw error;
			}
		},
	},
});
