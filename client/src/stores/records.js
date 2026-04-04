import { defineStore } from 'pinia';
import { useAuthStore } from './auth.js';
import { addVisitNoteByRole, fetchRecordsByRole } from './helpers/medicalRecordsRoleApi.js';

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
				const response = await fetchRecordsByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					filters,
				});
				if (response) {
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
			const updated = await addVisitNoteByRole({
				role: auth.role,
				token: auth.token,
				userId: auth.userId,
				patientId,
				note,
			});
			if (!updated) return;
			await this.fetchRecords({ patientId });
		},
	},
});
