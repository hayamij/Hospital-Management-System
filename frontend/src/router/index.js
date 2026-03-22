import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import DashboardPage from '../pages/DashboardPage.vue';
import AppointmentsPage from '../pages/AppointmentsPage.vue';
import PatientsPage from '../pages/PatientsPage.vue';
import DoctorsPage from '../pages/DoctorsPage.vue';
import MedicalRecordsPage from '../pages/MedicalRecordsPage.vue';
import BillingPage from '../pages/BillingPage.vue';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', redirect: '/dashboard' },
		{ path: '/dashboard', component: DashboardPage, meta: { roles: ['guest', 'patient', 'doctor', 'admin'] } },
		{ path: '/appointments', component: AppointmentsPage, meta: { roles: ['patient', 'doctor', 'admin'] } },
		{ path: '/patients', component: PatientsPage, meta: { roles: ['patient', 'admin'] } },
		{ path: '/doctors', component: DoctorsPage, meta: { roles: ['doctor', 'admin'] } },
		{ path: '/medical-records', component: MedicalRecordsPage, meta: { roles: ['patient', 'doctor', 'admin'] } },
		{ path: '/billing', component: BillingPage, meta: { roles: ['patient', 'admin'] } },
	],
});

router.beforeEach((to) => {
	const auth = useAuthStore();
	const allowed = to.meta?.roles ?? ['guest', 'patient', 'doctor', 'admin'];
	if (!allowed.includes(auth.currentUserRole)) {
		return '/dashboard';
	}
	return true;
});

export default router;
