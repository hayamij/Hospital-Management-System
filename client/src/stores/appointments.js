import { defineStore } from 'pinia';
import { patientApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { usePatientsStore } from './patients.js';
import { isRole } from '../constants/navigation.js';
import {
	fetchAppointmentsByRole,
	updateAppointmentStatusByRole,
} from './helpers/appointmentsRoleApi.js';

const resolvePatientId = async (auth) => {
	if (!isRole(auth.role, 'patient')) return null;
	if (auth.patientId) return auth.patientId;

	const patientsStore = usePatientsStore();
	try {
		const profile = await patientsStore.loadProfile();
		return profile?.patientId || auth.patientId || null;
	} catch {
		return auth.patientId || null;
	}
};

export const useAppointmentsStore = defineStore('appointments', {
	state: () => ({
		items: [],
		page: 1,
		pageSize: 10,
		total: 0,
		activeFilters: {},
		loading: false,
		error: null,
	}),
	actions: {
		async fetchAppointments(filters = {}) {
			const auth = useAuthStore();
				const patientId = await resolvePatientId(auth);
			this.loading = true;
			this.error = null;
			this.activeFilters = { ...filters };
			try {
				const result = await fetchAppointmentsByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					doctorId: auth.doctorId,
						patientId,
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
			const patientId = await resolvePatientId(auth);
			await patientApi.scheduleAppointment(auth.token, {
				...payload,
				patientId: patientId || auth.userId,
			});
			await this.fetchAppointments(this.activeFilters);
		},
		async reschedule(appointmentId, payload) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return;
			const patientId = await resolvePatientId(auth);
			await patientApi.rescheduleAppointment(auth.token, appointmentId, {
				...payload,
				patientId: patientId || auth.userId,
			});
			await this.fetchAppointments(this.activeFilters);
		},
		async cancel(appointmentId) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return;
			await patientApi.cancelAppointment(auth.token, appointmentId);
			await this.fetchAppointments(this.activeFilters);
		},
		async updateStatus(appointmentId, payload) {
			const auth = useAuthStore();
			const updated = await updateAppointmentStatusByRole({
				role: auth.role,
				token: auth.token,
				userId: auth.userId,
				doctorId: auth.doctorId,
				appointmentId,
				payload,
			});
			if (!updated) return;
			await this.fetchAppointments(this.activeFilters);
			return updated;
		},
	},
});
