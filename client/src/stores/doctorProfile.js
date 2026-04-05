import { defineStore } from 'pinia';
import { doctorApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';

const toNonNegativeInt = (value, fallback = 0) => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0) return fallback;
	return Math.floor(parsed);
};

const normalizeProfile = (source = {}) => ({
	doctorId: source?.doctorId ?? source?.id ?? null,
	fullName: source?.fullName ?? source?.name ?? '',
	specialization: source?.specialization ?? '',
	department: source?.department ?? '',
	status: source?.status ?? 'active',
	slotsPerDay: toNonNegativeInt(source?.slotsPerDay, 0),
	updatedAt: source?.updatedAt ?? null,
});

export const useDoctorProfileStore = defineStore('doctorProfile', {
	state: () => ({
		form: {
			fullName: '',
			specialization: '',
			department: '',
			status: 'active',
			slotsPerDay: 0,
		},
		lastSaved: {
			doctorId: '',
			profile: null,
			slotsPerDay: null,
		},
		loading: false,
		submitting: false,
		error: '',
		success: '',
	}),
	actions: {
		clearMessages() {
			this.error = '';
			this.success = '';
		},
		applyForm(normalizedProfile) {
			this.form.fullName = normalizedProfile.fullName;
			this.form.specialization = normalizedProfile.specialization;
			this.form.department = normalizedProfile.department;
			this.form.status = normalizedProfile.status;
			this.form.slotsPerDay = normalizedProfile.slotsPerDay;
		},
		applyLastSaved(normalizedProfile) {
			this.lastSaved.doctorId = normalizedProfile.doctorId || '';
			this.lastSaved.profile = {
				fullName: normalizedProfile.fullName,
				specialization: normalizedProfile.specialization,
				department: normalizedProfile.department,
				status: normalizedProfile.status,
				updatedAt: normalizedProfile.updatedAt,
			};
			this.lastSaved.slotsPerDay = normalizedProfile.slotsPerDay;
		},
		async loadProfile({ clearFeedback = true } = {}) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'doctor')) return null;

			this.loading = true;
			if (clearFeedback) {
				this.clearMessages();
			}

			try {
				const response = await doctorApi.getProfile(auth.token, {
					doctorId: auth.userId || undefined,
				});
				const normalized = normalizeProfile(response || {});
				this.applyForm(normalized);
				this.applyLastSaved(normalized);
				return normalized;
			} catch (error) {
				this.error = error?.message || 'Không thể tải hồ sơ bác sĩ.';
				throw error;
			} finally {
				this.loading = false;
			}
		},
		restoreDefaults() {
			const auth = useAuthStore();
			const fallback = normalizeProfile({
				doctorId: auth.userId,
				fullName: auth.userProfile?.name || '',
				specialization: '',
				department: '',
				status: 'active',
				slotsPerDay: 0,
			});

			const fromLastSaved = this.lastSaved.profile
				? normalizeProfile({
					doctorId: this.lastSaved.doctorId || auth.userId,
					fullName: this.lastSaved.profile.fullName,
					specialization: this.lastSaved.profile.specialization,
					department: this.lastSaved.profile.department,
					status: this.lastSaved.profile.status,
					slotsPerDay: this.lastSaved.slotsPerDay,
					updatedAt: this.lastSaved.profile.updatedAt,
				})
				: null;

			this.applyForm(fromLastSaved || fallback);
			this.clearMessages();
		},
		async updateProfile() {
			const auth = useAuthStore();
			this.clearMessages();
			this.submitting = true;

			try {
				const payload = {
					doctorId: auth.userId,
					profile: {
						fullName: this.form.fullName,
						specialization: this.form.specialization,
						department: this.form.department,
						status: this.form.status,
					},
					slotsPerDay: Number(this.form.slotsPerDay),
				};

				const updated = await doctorApi.updateProfile(auth.token, payload);
				const mergedProfile = normalizeProfile({
					doctorId: updated?.doctorId || auth.userId,
					fullName: updated?.profile?.fullName ?? payload.profile.fullName,
					specialization: updated?.profile?.specialization ?? payload.profile.specialization,
					department: updated?.profile?.department ?? payload.profile.department,
					status: updated?.profile?.status ?? payload.profile.status,
					slotsPerDay: updated?.slotsPerDay ?? payload.slotsPerDay,
				});

				this.applyForm(mergedProfile);
				this.applyLastSaved(mergedProfile);
				await this.loadProfile({ clearFeedback: false });
				this.success = 'Cập nhật hồ sơ bác sĩ thành công.';
				return updated;
			} catch (error) {
				this.error = error?.message || 'Không thể cập nhật hồ sơ bác sĩ.';
				throw error;
			} finally {
				this.submitting = false;
			}
		},
	},
});
