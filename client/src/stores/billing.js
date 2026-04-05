import { defineStore } from 'pinia';
import { patientApi, adminApi } from '../services/api.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';

export const useBillingStore = defineStore('billing', {
	state: () => ({
		invoices: [],
		payments: [],
		loading: false,
		error: null,
		page: 1,
		pageSize: 10,
		total: 0,
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
						patientId: auth.userId,
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
		async manageInvoice(invoiceId, payload) {
			const auth = useAuthStore();
			if (!isRole(auth.role, 'admin')) return;
			await adminApi.manageBilling(auth.token, invoiceId, payload);
			await this.fetchBilling({ page: this.page, pageSize: this.pageSize });
		},
	},
});
