import { defineStore } from 'pinia';
import { patientApi, adminApi, doctorApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';

const normalizeDoctorPendingError = (error) => {
	const message = String(error?.message || '').trim();
	if (/Cannot GET\s*\/api\/doctors\/payments\/pending/i.test(message)) {
		return 'Không thể tải danh sách chờ xác nhận thanh toán. Vui lòng kiểm tra backend API đã khởi động và restart server sau khi cập nhật route.';
	}
	if (/Doctor not found\.?/i.test(message)) {
		return 'Không thể tải danh sách chờ xác nhận thanh toán do hồ sơ bác sĩ chưa liên kết đúng tài khoản. Vui lòng đăng xuất/đăng nhập lại hoặc liên hệ admin kiểm tra liên kết user-doctor.';
	}
	return message || 'Không thể tải danh sách chờ xác nhận thanh toán.';
};

export const useBillingStore = defineStore('billing', {
	state: () => ({
		invoices: [],
		payments: [],
		loading: false,
		error: null,
		page: 1,
		pageSize: 10,
		total: 0,
		doctorPendingPayments: [],
		doctorPendingLoading: false,
		doctorPendingError: null,
		doctorPendingPage: 1,
		doctorPendingPageSize: 10,
		doctorPendingTotal: 0,
		doctorPendingStatus: null,
		submittingTransfer: false,
		reviewingPayment: false,
		doctorInvoices: [],
		doctorBillingLoading: false,
		doctorBillingError: null,
		doctorBillingPage: 1,
		doctorBillingPageSize: 10,
		doctorBillingTotal: 0,
	}),
	actions: {
		async fetchBilling(filters = {}) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient') && !isRole(auth.role, 'admin')) return null;
			this.loading = true;
			this.error = null;
			try {
				const params = {
					...filters,
					page: filters.page || this.page,
					pageSize: filters.pageSize || this.pageSize,
				};

				const response = isRole(auth.role, 'admin')
					? await adminApi.listBilling(auth.token, params)
					: await patientApi.listBilling(auth.token, {
						...params,
						patientId: auth.patientId || auth.userId,
					});
				this.invoices = response.billings || [];
				this.payments = response.payments || [];
				this.total = response.total || 0;
				this.page = response.page || 1;
				this.pageSize = response.pageSize || this.pageSize;
				return response;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.loading = false;
			}
		},
		async submitTransferPayment(invoiceId, payload = {}) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'patient')) return null;

			this.submittingTransfer = true;
			this.error = null;
			try {
				const response = await patientApi.submitTransferPayment(auth.token, invoiceId, {
					patientId: auth.patientId || auth.userId,
					amount: payload.amount,
					transferReference: payload.transferReference,
					note: payload.note,
					method: payload.method,
				});

				await this.fetchBilling({ page: this.page, pageSize: this.pageSize });
				return response;
			} catch (error) {
				this.error = error.message;
				throw error;
			} finally {
				this.submittingTransfer = false;
			}
		},
		async fetchDoctorPendingPayments(filters = {}) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'doctor')) return null;

			this.doctorPendingLoading = true;
			this.doctorPendingError = null;
			try {
				const actorDoctorId = auth.doctorId || null;
				const hasStatusFilter = Object.prototype.hasOwnProperty.call(filters, 'status');
				const resolvedStatus = hasStatusFilter ? filters.status : this.doctorPendingStatus;
				const params = {
					...filters,
					page: filters.page || this.doctorPendingPage,
					pageSize: filters.pageSize || this.doctorPendingPageSize,
				};
				if (actorDoctorId) {
					params.doctorId = actorDoctorId;
				}
				if (resolvedStatus !== undefined && resolvedStatus !== null && resolvedStatus !== '') {
					params.status = resolvedStatus;
				} else {
					delete params.status;
				}
				const response = await doctorApi.listPendingPayments(auth.token, params);

				this.doctorPendingPayments = response?.payments || [];
				this.doctorPendingTotal = response?.total || 0;
				this.doctorPendingPage = response?.page || 1;
				this.doctorPendingPageSize = response?.pageSize || this.doctorPendingPageSize;
				this.doctorPendingStatus = params.status ?? null;
				return response;
			} catch (error) {
				this.doctorPendingError = normalizeDoctorPendingError(error);
				throw error;
			} finally {
				this.doctorPendingLoading = false;
			}
		},
		async reviewDoctorPayment(paymentId, payload = {}) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'doctor')) return null;

			this.reviewingPayment = true;
			this.doctorPendingError = null;
			try {
				const actorDoctorId = auth.doctorId || null;
				const reviewPayload = {
					...payload,
				};
				if (actorDoctorId) {
					reviewPayload.doctorId = actorDoctorId;
				}

				const response = await doctorApi.reviewPayment(auth.token, paymentId, reviewPayload);
				await this.fetchDoctorPendingPayments({
					page: this.doctorPendingPage,
					pageSize: this.doctorPendingPageSize,
					status: this.doctorPendingStatus,
					...(actorDoctorId ? { doctorId: actorDoctorId } : {}),
				});
				return response;
			} catch (error) {
				this.doctorPendingError = error.message;
				throw error;
			} finally {
				this.reviewingPayment = false;
			}
		},
		async fetchDoctorBilling(filters = {}) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'doctor')) return null;

			this.doctorBillingLoading = true;
			this.doctorBillingError = null;
			try {
				const actorDoctorId = auth.doctorId || null;
				const params = {
					...filters,
					status: filters.status || undefined,
					page: filters.page || this.doctorBillingPage,
					pageSize: filters.pageSize || this.doctorBillingPageSize,
				};
				if (actorDoctorId) {
					params.doctorId = actorDoctorId;
				}
				const response = await doctorApi.listBilling(auth.token, params);

				this.doctorInvoices = response?.billings || [];
				this.doctorBillingTotal = response?.total || 0;
				this.doctorBillingPage = response?.page || 1;
				this.doctorBillingPageSize = response?.pageSize || this.doctorBillingPageSize;
				return response;
			} catch (error) {
				this.doctorBillingError = error.message;
				throw error;
			} finally {
				this.doctorBillingLoading = false;
			}
		},
		async manageInvoice(invoiceId, payload) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'admin')) return;
			await adminApi.manageBilling(auth.token, invoiceId, payload);
			await this.fetchBilling({ page: this.page, pageSize: this.pageSize });
		},
	},
});
