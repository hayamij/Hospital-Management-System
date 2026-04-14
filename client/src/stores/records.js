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
		recordMeta: {
			hasRecord: false,
			recordId: null,
			recordCreatedAt: null,
		},
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
			this.recordMeta = {
				hasRecord: false,
				recordId: null,
				recordCreatedAt: null,
			};
			try {
				const response = await fetchRecordsByRole({
					role: auth.role,
					token: auth.token,
					userId: auth.userId,
					patientId: auth.patientId,
					filters,
				});

				const hasRecord = Boolean(response?.hasRecord || response?.recordId);
				const recordMeta = {
					hasRecord,
					recordId: response?.recordId ?? null,
					recordCreatedAt: response?.recordCreatedAt ?? null,
				};
				this.recordMeta = recordMeta;

				const mappedList = this.toRecordList(response);
				const shouldUsePlaceholder = auth.role === 'doctor' && hasRecord && mappedList.length === 0;
				if (shouldUsePlaceholder) {
					const baseRecordId = recordMeta.recordId || String(filters?.patientId || 'unknown-patient');
					const baseCreatedAt = recordMeta.recordCreatedAt || null;
					this.list = [
						{
							id: `record-placeholder-${baseRecordId}`,
							recordId: baseRecordId,
							note: 'Ho so benh an da duoc tao, chua co ghi chu kham.',
							description: 'Ho so benh an da duoc tao, chua co ghi chu kham.',
							doctorId: null,
							authorDoctorId: null,
							recordedAt: baseCreatedAt,
							createdAt: baseCreatedAt,
							isRecordPlaceholder: true,
						},
					];
				} else {
					this.list = mappedList;
				}

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
					doctorId: auth.doctorId,
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
					doctorId: auth.doctorId,
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
