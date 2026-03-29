import { defineStore } from 'pinia';
import { doctorApi } from '../services/api.js';
import { useAuthStore } from './auth.js';

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
		submitting: false,
		error: '',
		success: '',
	}),
	actions: {
		clearMessages() {
			this.error = '';
			this.success = '';
		},
		restoreDefaults() {
			const auth = useAuthStore();
			this.form.fullName = auth.userProfile?.name || '';
			this.form.specialization = '';
			this.form.department = '';
			this.form.status = 'active';
			this.form.slotsPerDay = 0;
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

				this.lastSaved.doctorId = updated?.doctorId || auth.userId;
				this.lastSaved.profile = updated?.profile || { ...payload.profile };
				this.lastSaved.slotsPerDay = updated?.slotsPerDay ?? payload.slotsPerDay;
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
