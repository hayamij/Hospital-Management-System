import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import PublicLayout from '../app/layouts/PublicLayout.vue';
import BackofficeLayout from '../app/layouts/BackofficeLayout.vue';
import AdminDashboard from '../pages/AdminDashboard.vue';
import AppointmentsPage from '../pages/AppointmentsPage.vue';
import InvoicesPage from '../pages/InvoicesPage.vue';
import BookingPage from '../pages/BookingPage.vue';
import BackofficeBillingPage from '../pages/BackofficeBillingPage.vue';
import DoctorsPage from '../pages/DoctorsPage.vue';
import MedicalRecordsPage from '../pages/MedicalRecordsPage.vue';
import BackofficeMedicalRecordsPage from '../pages/BackofficeMedicalRecordsPage.vue';
import PatientsPage from '../pages/PatientsPage.vue';
import PatientDashboard from '../pages/PatientDashboard.vue';
import PatientProfile from '../pages/PatientProfile.vue';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import PublicPortalPage from '../pages/PublicPortalPage.vue';
import AboutUsPage from '../pages/AboutUsPage.vue';
import NewsPage from '../pages/NewsPage.vue';
import CommunicationsPage from '../pages/CommunicationsPage.vue';
import AdminOpsPage from '../pages/AdminOpsPage.vue';
import ConsultationPage from '../pages/ConsultationPage.vue';
import DoctorDashboard from '../pages/DoctorDashboard.vue';
import HomePage from '../pages/HomePage.vue';
import DoctorDirectoryPage from '../pages/DoctorDirectoryPage.vue';
import HomeFeaturePage from '../pages/HomeFeaturePage.vue';
import PublicServicesPage from '../pages/PublicServicesPage.vue';
import PublicServiceDetailPage from '../pages/PublicServiceDetailPage.vue';
import PublicCardDetailPage from '../pages/PublicCardDetailPage.vue';

const getRoleHome = (role) => {
	if (role === 'admin') return '/admin/dashboard';
	if (role === 'doctor') return '/doctor/dashboard';
	if (role === 'patient') return '/patient/dashboard';
	return '/';
};

const redirectLegacyByRole = () => {
	const auth = useAuthStore();
	auth.fetchCurrentUser();

	if (auth.role === 'admin') return '/admin/dashboard';
	if (auth.role === 'doctor') return '/doctor/dashboard';
	if (auth.role === 'patient') return '/patient/dashboard';
	return '/login';
};

const routes = [
	{
		path: '/',
		component: PublicLayout,
		children: [
			{ path: '', component: HomePage, meta: { public: true } },
			{ path: 'home', redirect: '/' },
			{ path: 'services', component: PublicServicesPage, meta: { public: true } },
			{ path: 'doctors', component: DoctorDirectoryPage, meta: { public: true } },
			{ path: 'about', component: AboutUsPage, meta: { public: true } },
			{ path: 'news', component: NewsPage, meta: { public: true } },
			{ path: 'public', component: PublicPortalPage, meta: { public: true } },
			{ path: 'login', component: LoginPage, meta: { public: true } },
			{ path: 'register', component: RegisterPage, meta: { public: true } },
			{ path: 'home-feature/:group/:id', component: HomeFeaturePage, meta: { public: true } },
			{ path: 'services/:serviceId', component: PublicServiceDetailPage, meta: { public: true } },
			{ path: 'public-card/:category/:itemId', component: PublicCardDetailPage, meta: { public: true } },
		],
	},
	{
		path: '/patient',
		component: PublicLayout,
		meta: { roles: ['patient'] },
		children: [
			{ path: '', redirect: '/patient/dashboard' },
			{ path: 'dashboard', component: PatientDashboard },
			{ path: 'profile', component: PatientProfile },
			{ path: 'booking', component: BookingPage },
			{ path: 'appointments', component: AppointmentsPage },
			{ path: 'billing', component: InvoicesPage },
			{ path: 'invoices', component: InvoicesPage },
			{ path: 'records', component: MedicalRecordsPage },
			{ path: 'communications', component: CommunicationsPage },
		],
	},
	{
		path: '/doctor',
		component: BackofficeLayout,
		meta: { roles: ['doctor'] },
		children: [
			{ path: '', redirect: '/doctor/dashboard' },
			{ path: 'dashboard', component: DoctorDashboard },
			{ path: 'consultation/:patientId?', component: ConsultationPage },
			{ path: 'appointments', component: AppointmentsPage },
			{ path: 'patients', component: PatientsPage },
			{ path: 'records', component: BackofficeMedicalRecordsPage },
			{ path: 'communications', component: CommunicationsPage },
		],
	},
	{
		path: '/admin',
		component: BackofficeLayout,
		meta: { roles: ['admin'] },
		children: [
			{ path: '', redirect: '/admin/dashboard' },
			{ path: 'dashboard', component: AdminDashboard },
			{ path: 'appointments', component: AppointmentsPage },
			{ path: 'doctors', component: DoctorsPage },
			{ path: 'patients', component: PatientsPage },
			{ path: 'records', component: BackofficeMedicalRecordsPage },
			{ path: 'billing', component: BackofficeBillingPage },
			{ path: 'ops', component: AdminOpsPage },
		],
	},
	{ path: '/dashboard', redirect: () => redirectLegacyByRole() },
	{ path: '/appointments', redirect: () => {
		const auth = useAuthStore();
		auth.fetchCurrentUser();
		if (auth.role === 'admin') return '/admin/appointments';
		if (auth.role === 'doctor') return '/doctor/appointments';
		return '/patient/appointments';
	} },
	{ path: '/patients', redirect: () => {
		const auth = useAuthStore();
		auth.fetchCurrentUser();
		if (auth.role === 'admin') return '/admin/patients';
		if (auth.role === 'doctor') return '/doctor/patients';
		return '/patient/dashboard';
	} },
	{ path: '/records', redirect: () => {
		const auth = useAuthStore();
		auth.fetchCurrentUser();
		if (auth.role === 'admin') return '/admin/records';
		if (auth.role === 'doctor') return '/doctor/records';
		return '/patient/records';
	} },
	{ path: '/billing', redirect: () => {
		const auth = useAuthStore();
		auth.fetchCurrentUser();
		if (auth.role === 'admin') return '/admin/billing';
		return '/patient/billing';
	} },
	{ path: '/communications', redirect: () => {
		const auth = useAuthStore();
		auth.fetchCurrentUser();
		if (auth.role === 'doctor') return '/doctor/communications';
		return '/patient/communications';
	} },
	{ path: '/doctor-ops', redirect: '/doctor/dashboard' },
	{ path: '/admin-ops', redirect: '/admin/ops' },
	{
		path: '/:pathMatch(.*)*',
		redirect: '/',
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

router.beforeEach((to, _from, next) => {
	const auth = useAuthStore();
	auth.fetchCurrentUser();

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
