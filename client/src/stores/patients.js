import { defineStore } from 'pinia';
import { patientApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';
import { addVisitNoteByRole, fetchRecordsByRole } from './helpers/medicalRecordsRoleApi.js';

const readAllergies = (emergencyContact) => {
	if (!emergencyContact) return '';
	if (typeof emergencyContact === 'string') return emergencyContact;
	if (typeof emergencyContact === 'object') {
		if (typeof emergencyContact.allergies === 'string') {
			return emergencyContact.allergies;
		}
		if (typeof emergencyContact.note === 'string') {
			return emergencyContact.note;
		}
	}
	return '';
};

const normalizeProfile = (source = {}) => ({
	patientId: source.patientId ?? source.id ?? null,
	name: source.fullName ?? source.name ?? '',
	dateOfBirth: source.dateOfBirth ?? '',
	email: source.email ?? '',
	phone: source.phone ?? '',
	address: source.address ?? '',
	allergies: readAllergies(source.emergencyContact),
	emergencyContact: source.emergencyContact ?? null,
	status: source.status ?? 'active',
	assignedDoctorId: source.assignedDoctorId ?? null,
	updatedAt: source.updatedAt ?? null,
});

export const usePatientsStore = defineStore('patients', {
	state: () => ({
		profile: null,
		records: [],
		loading: false,
		error: null,
	}),
	actions: {
		async loadProfile() {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return null;
			this.loading = true;
			this.error = null;
			try {
				const response = await patientApi.getProfile(auth.token, {
					patientId: auth.patientId || undefined,
				});
				this.profile = normalizeProfile(response || {});
				return this.profile;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async updateProfile(payload) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return;
			this.loading = true;
			this.error = null;
			try {
				const response = await patientApi.updateProfile(auth.token, {
					name: payload?.name,
					phone: payload?.phone,
					address: payload?.address,
					emergencyContact: payload?.allergies || null,
					patientId: auth.patientId || undefined,
				});
				await this.loadProfile();
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
