import { defineStore } from 'pinia';
import { useAppointmentsStore } from './appointments.js';
import { useBillingStore } from './billing.js';
import { useRecordsStore } from './records.js';
import { useAuthStore } from './auth.js';
import { isRole } from '../constants/navigation.js';

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
				const isPatientView = isRole(auth.role, 'patient');

				await Promise.allSettled([
					appointments.fetchAppointments({ pageSize: 5 }),
					isPatientView ? billing.fetchBilling({ pageSize: 5 }) : Promise.resolve(),
					isPatientView ? records.fetchRecords({}) : Promise.resolve(),
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
