import axios from 'axios';
import {
	clearStoredSession,
	readStoredToken,
	redirectToLogin,
} from './sessionStorage.js';

const API_BASE = '/api';

const http = axios.create({
	baseURL: API_BASE,
	headers: {
		'Content-Type': 'application/json',
	},
});

http.interceptors.request.use((config) => {
	const token = readStoredToken();
	if (token) {
		config.headers = config.headers || {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

http.interceptors.response.use(
	(response) => {
		const payload = response?.data;
		if (payload && typeof payload === 'object' && 'data' in payload) {
			return payload.data;
		}
		return payload;
	},
	(error) => {
		const status = error?.response?.status;
		const payload = error?.response?.data;
		const message =
			(typeof payload === 'string' && payload) ||
			payload?.message ||
			payload?.error ||
			error?.message ||
			'Request failed';

		const wrapped = new Error(message);
		wrapped.status = status;
		wrapped.details = payload;

		if (status === 401 && typeof window !== 'undefined') {
			clearStoredSession();
			redirectToLogin();
		}

		return Promise.reject(wrapped);
	}
);

const toQueryParams = (params = {}) => {
	const out = {};
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== '') {
			out[key] = value;
		}
	}
	return out;
};

async function request(path, { method = 'GET', data, params, token } = {}) {
	const config = {
		url: path.startsWith('/') ? path : `/${path}`,
		method,
		params: params ? toQueryParams(params) : undefined,
		data,
	};

	if (token) {
		config.headers = {
			Authorization: `Bearer ${token}`,
		};
	}

	return http.request(config);
}

export const authApi = {
	login(credentials) {
		return request('/auth/login', { method: 'POST', data: credentials });
	},
	logout(sessionOrToken) {
		const token =
			typeof sessionOrToken === 'string'
				? sessionOrToken
				: sessionOrToken?.token ?? null;
		const refreshToken =
			typeof sessionOrToken === 'string'
				? null
				: sessionOrToken?.refreshToken ?? null;

		return request('/auth/logout', {
			method: 'POST',
			token,
			data: {
				accessToken: token,
				refreshToken,
			},
		});
	},
	resetPassword(data) {
		return request('/auth/reset-password', { method: 'POST', data });
	},
};

export const patientApi = {
	register(data) {
		return request('/patients/register', { method: 'POST', data });
	},
	getProfile(token, params) {
		return request('/patients/profile', { method: 'GET', token, params });
	},
	updateProfile(token, payload) {
		return request('/patients/profile', { method: 'PUT', token, data: payload });
	},
	listAppointments(token, filters) {
		return request('/patients/appointments', { method: 'GET', token, params: filters });
	},
	scheduleAppointment(token, payload) {
		return request('/patients/appointments', { method: 'POST', token, data: payload });
	},
	rescheduleAppointment(token, appointmentId, payload) {
		return request(`/patients/appointments/${appointmentId}`, { method: 'PUT', token, data: payload });
	},
	cancelAppointment(token, appointmentId) {
		return request(`/patients/appointments/${appointmentId}`, { method: 'DELETE', token });
	},
	listBilling(token, filters) {
		return request('/patients/billing', { method: 'GET', token, params: filters });
	},
	downloadInvoice(token, invoiceId) {
		return request(`/patients/invoices/${invoiceId}/download`, { method: 'GET', token });
	},
	listRecords(token, filters) {
		return request('/patients/medical-records', { method: 'GET', token, params: filters });
	},
	downloadPrescription(token, prescriptionId) {
		return request(`/patients/prescriptions/${prescriptionId}/download`, { method: 'GET', token });
	},
	searchDoctors(filters) {
		const params = { q: filters?.query, specialty: filters?.specialty, page: filters?.page, pageSize: filters?.pageSize };
		return request('/patients/doctors/search', { method: 'GET', params });
	},
	sendMessage(token, payload) {
		return request('/patients/messages', { method: 'POST', token, data: payload });
	},
};

export const doctorApi = {
	login(credentials) {
		return authApi.login(credentials);
	},
	getSchedule(token, params) {
		return request('/doctors/schedule', { method: 'GET', token, params });
	},
	updateAppointmentDecision(token, appointmentId, payload) {
		return request(`/doctors/appointments/${appointmentId}/decision`, { method: 'POST', token, data: payload });
	},
	updateAppointmentStatus(token, appointmentId, payload) {
		return request(`/doctors/appointments/${appointmentId}/status`, { method: 'POST', token, data: payload });
	},
	addVisitNote(token, patientId, payload) {
		return request(`/doctors/patients/${patientId}/visit-notes`, { method: 'POST', token, data: payload });
	},
	createMedicalRecord(token, patientId, payload) {
		return request(`/doctors/patients/${patientId}/records`, { method: 'POST', token, data: payload });
	},
	updateMedicalRecordEntry(token, recordId, payload) {
		return request(`/doctors/records/${recordId}/entries`, { method: 'POST', token, data: payload });
	},
	viewPatientRecords(token, patientId, params) {
		return request(`/doctors/patients/${patientId}/chart`, { method: 'GET', token, params });
	},
	sendMessage(token, payload) {
		return request('/doctors/messages', { method: 'POST', token, data: payload });
	},
	updateProfile(token, payload) {
		return request('/doctors/profile', { method: 'PUT', token, data: payload });
	},
	reviewLabResult(token, labResultId, payload) {
		return request(`/doctors/lab-results/${labResultId}/review`, { method: 'POST', token, data: payload });
	},
};

export const adminApi = {
	login(credentials) {
		return authApi.login(credentials);
	},
	overrideAppointment(token, appointmentId, payload) {
		return request(`/admin/appointments/${appointmentId}/override`, { method: 'POST', token, data: payload });
	},
	manageBilling(token, invoiceId, payload) {
		return request(`/admin/billing/${invoiceId}/action`, { method: 'POST', token, data: payload });
	},
	manageDoctorSchedule(token, doctorId, payload) {
		return request(`/admin/doctors/${doctorId}/schedule`, { method: 'PUT', token, data: payload });
	},
	upsertService(token, payload) {
		return request('/admin/services', { method: 'POST', token, data: payload });
	},
	removeService(token, serviceId) {
		return request(`/admin/services/${serviceId}`, { method: 'DELETE', token });
	},
	updateSettings(token, payload) {
		return request('/admin/settings', { method: 'PUT', token, data: payload });
	},
	runReport(token, params) {
		return request('/admin/reports', { method: 'GET', token, params });
	},
	assignRole(token, userId, payload) {
		return request(`/admin/users/${userId}/roles`, { method: 'POST', token, data: payload });
	},
	listUsers(token, params) {
		return request('/admin/users', { method: 'GET', token, params });
	},
	createUser(token, payload) {
		return request('/admin/users', { method: 'POST', token, data: payload });
	},
	updateUser(token, userId, payload) {
		return request(`/admin/users/${userId}`, { method: 'PUT', token, data: payload });
	},
	updateUserStatus(token, userId, payload) {
		return request(`/admin/users/${userId}/status`, { method: 'PATCH', token, data: payload });
	},
	auditMedicalRecord(token, recordId, payload) {
		return request(`/admin/medical-records/${recordId}/audit`, { method: 'POST', token, data: payload });
	},
};

export const guestApi = {
	publicInfo() {
		return request('/guests/public-info');
	},
	searchDoctors(filters) {
		const params = { q: filters?.query, specialization: filters?.specialty };
		return request('/guests/doctors/search', { params });
	},
	startRegistration(payload) {
		return request('/guests/registration', { method: 'POST', data: payload });
	},
	contact(payload) {
		return request('/guests/contact', { method: 'POST', data: payload });
	},
	availableSlots(doctorId, params) {
		return request(`/guests/doctors/${doctorId}/available-slots`, { params });
	},
	getServiceDetail(serviceId) {
		return request(`/guests/services/${serviceId}`);
	},
	cardDetail(category, itemId) {
		return request(`/guests/cards/${encodeURIComponent(category)}/${encodeURIComponent(itemId)}`);
	},
};

export { request, http };
