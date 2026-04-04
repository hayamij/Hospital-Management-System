import { defineStore } from 'pinia';
import { adminApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';
import { mapDoctorsSearchResult, searchDoctorsByAuth } from './helpers/doctorsSearchApi.js';

export const useDoctorsStore = defineStore('doctors', {
	state: () => ({
		list: [],
		total: 0,
		loading: false,
		error: null,
	}),
	actions: {
		async search(filters = {}) {
			this.loading = true;
			this.error = null;
			try {
				const auth = useAuthStore();
				const response = await searchDoctorsByAuth({
					isAuthenticated: auth.isAuthenticated,
					filters,
				});
				const mapped = mapDoctorsSearchResult(response);
				this.list = mapped.list;
				this.total = mapped.total;
				return response;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async upsertService(service) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'admin')) return;
			await adminApi.upsertService(auth.token, { action: 'upsert', service });
		},
		async removeService(serviceId) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'admin')) return;
			await adminApi.removeService(auth.token, serviceId);
		},
	},
});
