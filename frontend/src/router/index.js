import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import DashboardPage from '../pages/DashboardPage.vue';
import AppointmentsPage from '../pages/AppointmentsPage.vue';
import BillingPage from '../pages/BillingPage.vue';
import DoctorsPage from '../pages/DoctorsPage.vue';
import MedicalRecordsPage from '../pages/MedicalRecordsPage.vue';
import PatientsPage from '../pages/PatientsPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import PublicPortalPage from '../pages/PublicPortalPage.vue';
import CommunicationsPage from '../pages/CommunicationsPage.vue';
import AdminOpsPage from '../pages/AdminOpsPage.vue';
import DoctorOpsPage from '../pages/DoctorOpsPage.vue';
import UseCasesPage from '../pages/UseCasesPage.vue';
import HomePage from '../pages/HomePage.vue';
import HomeFeaturePage from '../pages/HomeFeaturePage.vue';
import PublicServiceDetailPage from '../pages/PublicServiceDetailPage.vue';

const getRoleHome = (role) => {
	if (role === 'admin') return '/dashboard';
	if (role === 'doctor') return '/doctor-ops';
	if (role === 'patient') return '/patients';
	return '/';
};

const routes = [
	{ path: '/', component: HomePage, meta: { public: true } },
	{ path: '/home', redirect: '/' },
	{ path: '/home-feature/:group/:id', component: HomeFeaturePage, meta: { public: true } },
	{ path: '/services/:serviceId', component: PublicServiceDetailPage, meta: { public: true } },
	{ path: '/usecases', component: UseCasesPage, meta: { public: true } },
	{ path: '/public', component: PublicPortalPage, meta: { public: true } },
	{ path: '/login', component: LoginPage, meta: { public: true } },
	{ path: '/register', component: RegisterPage, meta: { public: true } },
	{
		path: '/dashboard',
		component: DashboardPage,
		meta: { roles: ['doctor', 'admin'] },
	},
	{
		path: '/appointments',
		component: AppointmentsPage,
		meta: { roles: ['patient', 'doctor', 'admin'] },
	},
	{
		path: '/billing',
		component: BillingPage,
		meta: { roles: ['patient', 'admin'] },
	},
	{
		path: '/records',
		component: MedicalRecordsPage,
		meta: { roles: ['patient', 'doctor', 'admin'] },
	},
	{
		path: '/doctors',
		component: DoctorsPage,
		meta: { roles: ['patient', 'admin', 'doctor'] },
	},
	{
		path: '/patients',
		component: PatientsPage,
		meta: { roles: ['doctor', 'admin', 'patient'] },
	},
	{
		path: '/communications',
		component: CommunicationsPage,
		meta: { roles: ['doctor', 'patient'] },
	},
	{
		path: '/admin-ops',
		component: AdminOpsPage,
		meta: { roles: ['admin'] },
	},
	{
		path: '/doctor-ops',
		component: DoctorOpsPage,
		meta: { roles: ['doctor'] },
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to, _from, next) => {
	const auth = useAuthStore();
	auth.hydrate();

	if (to.meta?.public) {
		return next();
	}

	if (!auth.isAuthenticated) {
		return next('/login');
	}

	if (to.meta?.roles && !to.meta.roles.includes(auth.role)) {
		return next(getRoleHome(auth.role));
	}

	return next();
});

export default router;
