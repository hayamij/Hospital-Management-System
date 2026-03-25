import { defineStore } from 'pinia';
import { patientApi, guestApi, adminApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { normalizeDoctor } from '../services/mappers.js';

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
				const query = { query: filters.query, specialty: filters.specialty, page: filters.page, pageSize: filters.pageSize };
				const response = auth.isAuthenticated
					? await patientApi.searchDoctors(query)
					: await guestApi.searchDoctors(query);
				this.list = Array.isArray(response?.doctors) ? response.doctors.map(normalizeDoctor) : [];
				this.total = response.total || 0;
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
			if (auth.role !== 'admin') return;
			await adminApi.upsertService(auth.token, { action: 'upsert', service });
		},
		async removeService(serviceId) {
			const auth = useAuthStore();
			if (auth.role !== 'admin') return;
			await adminApi.removeService(auth.token, serviceId);
		},
	},
});
