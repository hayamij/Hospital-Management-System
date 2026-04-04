import { defineStore } from 'pinia';
import { patientApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';
import {
	fetchAppointmentsByRole,
	updateAppointmentStatusByRole,
} from './helpers/appointmentsRoleApi.js';

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
				const result = await fetchAppointmentsByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					filters,
					page: this.page,
					pageSize: this.pageSize,
				});

				if (result) {
					this.items = result.items;
					this.total = result.total;
					this.page = result.page;
					this.pageSize = result.pageSize;
					return result.response;
				}

				// Admin has override endpoint but no dedicated list; keep current list untouched
				return null;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async schedule(payload) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return;
			await patientApi.scheduleAppointment(auth.token, { ...payload, patientId: auth.userId });
			await this.fetchAppointments();
		},
		async reschedule(appointmentId, payload) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return;
			await patientApi.rescheduleAppointment(auth.token, appointmentId, { ...payload, patientId: auth.userId });
			await this.fetchAppointments();
		},
		async cancel(appointmentId) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return;
			await patientApi.cancelAppointment(auth.token, appointmentId);
			await this.fetchAppointments();
		},
		async updateStatus(appointmentId, payload) {
			const auth = useAuthStore();
			const updated = await updateAppointmentStatusByRole({
				role: auth.role,
				token: auth.token,
				userId: auth.userId,
				appointmentId,
				payload,
			});
			if (!updated) return;
			await this.fetchAppointments();
		},
	},
});
