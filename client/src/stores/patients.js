import { defineStore } from 'pinia';
import { patientApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';
import { addVisitNoteByRole, fetchRecordsByRole } from './helpers/medicalRecordsRoleApi.js';

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
			if (!isRole(auth.role, 'patient')) return;
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
				const response = await fetchRecordsByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					filters,
				});
				if (response) {
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
			const updated = await addVisitNoteByRole({
				role: auth.role,
				token: auth.token,
				userId: auth.userId,
				patientId,
				note,
			});
			if (!updated) return;
			await this.loadRecords({ patientId });
		},
	},
});
