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
import AdminStaffPage from '../pages/AdminStaffPage.vue';
import AdminServicesPage from '../pages/AdminServicesPage.vue';
import ConsultationPage from '../pages/ConsultationPage.vue';
import DoctorDashboard from '../pages/DoctorDashboard.vue';
import DoctorLabResultsPage from '../pages/DoctorLabResultsPage.vue';
import DoctorProfilePage from '../pages/DoctorProfilePage.vue';
import HomePage from '../pages/HomePage.vue';
import DoctorDirectoryPage from '../pages/DoctorDirectoryPage.vue';
import HomeFeaturePage from '../pages/HomeFeaturePage.vue';
import PublicServicesPage from '../pages/PublicServicesPage.vue';
import PublicServiceDetailPage from '../pages/PublicServiceDetailPage.vue';
import PublicCardDetailPage from '../pages/PublicCardDetailPage.vue';
import {
	AUTH_ROUTE,
	getRoleHomeRoute,
	getRoleRedirectPath,
} from '../constants/navigation.js';

const redirectLegacyByRole = () => {
	const auth = useAuthStore();
	auth.fetchCurrentUser();

	return getRoleHomeRoute(auth.role, AUTH_ROUTE.login);
};

const resolveLegacyRoleRedirect = (roleMap, fallbackPath) => {
	const auth = useAuthStore();
	auth.fetchCurrentUser();
	return getRoleRedirectPath(auth.role, roleMap, fallbackPath);
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
			{ path: 'booking', component: BookingPage, meta: { public: true } },
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
			{ path: 'lab-results', component: DoctorLabResultsPage },
			{ path: 'patients', component: PatientsPage },
			{ path: 'records', component: BackofficeMedicalRecordsPage },
			{ path: 'profile', component: DoctorProfilePage },
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
			{ path: 'staff', component: AdminStaffPage },
			{ path: 'appointments', component: AppointmentsPage },
			{ path: 'doctors', component: DoctorsPage },
			{ path: 'patients', component: PatientsPage },
			{ path: 'records', component: BackofficeMedicalRecordsPage },
			{ path: 'billing', component: BackofficeBillingPage },
			{ path: 'services', component: AdminServicesPage },
			{ path: 'ops', component: AdminOpsPage },
		],
	},
	{ path: '/dashboard', redirect: () => redirectLegacyByRole() },
	{ path: '/appointments', redirect: () => resolveLegacyRoleRedirect({
		admin: '/admin/appointments',
		doctor: '/doctor/appointments',
		patient: '/patient/appointments',
	}, '/patient/appointments') },
	{ path: '/patients', redirect: () => resolveLegacyRoleRedirect({
		admin: '/admin/patients',
		doctor: '/doctor/patients',
		patient: '/patient/dashboard',
	}, '/patient/dashboard') },
	{ path: '/records', redirect: () => resolveLegacyRoleRedirect({
		admin: '/admin/records',
		doctor: '/doctor/records',
		patient: '/patient/records',
	}, '/patient/records') },
	{ path: '/billing', redirect: () => resolveLegacyRoleRedirect({
		admin: '/admin/billing',
		patient: '/patient/billing',
	}, '/patient/billing') },
	{ path: '/communications', redirect: () => resolveLegacyRoleRedirect({
		doctor: '/doctor/communications',
		patient: '/patient/communications',
	}, '/patient/communications') },
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
		return next(AUTH_ROUTE.login);
	}

	if (to.meta?.roles && !to.meta.roles.includes(auth.role)) {
		return next(getRoleHomeRoute(auth.role));
	}

	return next();
});

export default router;
