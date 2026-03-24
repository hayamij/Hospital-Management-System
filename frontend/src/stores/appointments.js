import { defineStore } from 'pinia';
import { patientApi, doctorApi, adminApi } from '../services/api.js';
import { useAuthStore } from './auth.js';

export const useAppointmentsStore = defineStore('appointments', {
	state: () => ({
		items: [],
		page: 1,
		pageSize: 10,
		total: 0,
		loading: false,
		error: null,
	}),
	actions: {
		async fetchAppointments(filters = {}) {
			const auth = useAuthStore();
			this.loading = true;
			this.error = null;
			try {
				let response;
				if (auth.role === 'patient') {
					response = await patientApi.listAppointments(auth.token, {
						...filters,
						page: filters.page || this.page,
						pageSize: filters.pageSize || this.pageSize,
						patientId: auth.userId,
					});
					this.items = response.appointments || [];
					this.total = response.total || 0;
					this.page = response.page || 1;
					this.pageSize = response.pageSize || this.pageSize;
				} else if (auth.role === 'doctor') {
					response = await doctorApi.getSchedule(auth.token, filters);
					this.items = response.appointments || [];
					this.total = response.total || 0;
					this.page = response.page || 1;
					this.pageSize = response.pageSize || this.pageSize;
				} else if (auth.role === 'admin') {
					// Admin has override endpoint but no dedicated list; keep current list untouched
					this.items = this.items;
				}
				return response;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async schedule(payload) {
			const auth = useAuthStore();
			if (auth.role !== 'patient') return;
			await patientApi.scheduleAppointment(auth.token, { ...payload, patientId: auth.userId });
			await this.fetchAppointments();
		},
		async reschedule(appointmentId, payload) {
			const auth = useAuthStore();
			if (auth.role !== 'patient') return;
			await patientApi.rescheduleAppointment(auth.token, appointmentId, { ...payload, patientId: auth.userId });
			await this.fetchAppointments();
		},
		async cancel(appointmentId) {
			const auth = useAuthStore();
			if (auth.role !== 'patient') return;
			await patientApi.cancelAppointment(auth.token, appointmentId);
			await this.fetchAppointments();
		},
		async updateStatus(appointmentId, payload) {
			const auth = useAuthStore();
			if (auth.role === 'doctor') {
				await doctorApi.updateAppointmentStatus(auth.token, appointmentId, { ...payload, doctorId: auth.userId });
			} else if (auth.role === 'admin') {
				await adminApi.overrideAppointment(auth.token, appointmentId, payload);
			}
			await this.fetchAppointments();
		},
	},
});
