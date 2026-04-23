import { defineStore } from 'pinia';
import { doctorApi } from '../services/api.js';
import { useAuthStore } from './auth.js';

export const useDoctorLabResultsStore = defineStore('doctorLabResults', {
	state: () => ({
		recentReviews: [],
		reviewing: false,
		error: '',
		success: '',
	}),
	actions: {
		clearMessages() {
			this.error = '';
			this.success = '';
		},
		resetRecentReviews() {
			this.recentReviews = [];
		},
		async reviewLabResult(payload) {
			const auth = useAuthStore();
			this.clearMessages();
			this.reviewing = true;

			try {
				const actorDoctorId = auth.doctorId || null;
				const reviewPayload = {
					notes: payload.notes,
				};
				if (actorDoctorId) {
					reviewPayload.doctorId = actorDoctorId;
				}
				const result = await doctorApi.reviewLabResult(auth.token, payload.labResultId, reviewPayload);

				const reviewedAt = result?.reviewedAt
					? new Date(result.reviewedAt).toLocaleString('vi-VN')
					: new Date().toLocaleString('vi-VN');

				this.recentReviews = [
					{
						labResultId: result?.labResultId || payload.labResultId,
						patientId: payload.patientId || '',
						notes: payload.notes,
						reviewedAt,
					},
					...this.recentReviews,
				].slice(0, 10);

				this.success = `Đã duyệt kết quả xét nghiệm ${result?.labResultId || payload.labResultId} thành công.`;
				return result;
			} catch (error) {
				this.error = error?.message || 'Không thể duyệt kết quả xét nghiệm.';
				throw error;
			} finally {
				this.reviewing = false;
			}
		},
	},
});
