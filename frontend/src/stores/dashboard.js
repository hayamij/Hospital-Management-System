import { defineStore } from 'pinia';
import { useAppointmentsStore } from './appointments.js';
import { useBillingStore } from './billing.js';
import { useRecordsStore } from './records.js';
import { useAuthStore } from './auth.js';

export const useDashboardStore = defineStore('dashboard', {
	state: () => ({
		loading: false,
		snapshot: null,
		error: null,
	}),
	actions: {
		async load() {
			this.loading = true;
			this.error = null;
			try {
				const auth = useAuthStore();
				const appointments = useAppointmentsStore();
				const billing = useBillingStore();
				const records = useRecordsStore();

				await Promise.allSettled([
					appointments.fetchAppointments({ pageSize: 5 }),
					auth.role === 'patient' ? billing.fetchBilling({ pageSize: 5 }) : Promise.resolve(),
					auth.role === 'patient' ? records.fetchRecords({}) : Promise.resolve(),
				]);

				this.snapshot = {
					upcomingAppointments: appointments.items.slice(0, 5),
					invoices: billing.invoices?.slice(0, 5) || [],
					records: records.list?.slice(0, 5) || [],
				};
			} catch (error) {
				this.error = error.message;
			} finally {
				this.loading = false;
			}
		},
	},
});
