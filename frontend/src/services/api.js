const API_BASE = '/api';

const toQuery = (params = {}) =>
	Object.entries(params)
		.filter(([, value]) => value !== undefined && value !== null && value !== '')
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join('&');

async function request(path, { method = 'GET', data, params, token } = {}) {
	const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
	if (params) {
		const queryString = toQuery(params);
		if (queryString) {
			url.search = queryString;
		}
	}

	const headers = { 'Content-Type': 'application/json' };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(url.toString(), {
		method,
		headers,
		body: data ? JSON.stringify(data) : undefined,
	});

	const contentType = response.headers.get('content-type') || '';
	const payload = contentType.includes('application/json') ? await response.json() : await response.text();

	if (!response.ok) {
		const message = typeof payload === 'string' ? payload : payload?.message || payload?.error || 'Request failed';
		const error = new Error(message);
		error.status = response.status;
		error.details = payload;
		throw error;
	}

	if (payload && typeof payload === 'object' && 'data' in payload) {
		return payload.data;
	}

	return payload;
}

export const authApi = {
	login(credentials) {
		return request('/auth/login', { method: 'POST', data: credentials });
	},
	logout(token) {
		return request('/auth/logout', { method: 'POST', token, data: {} });
	},
	resetPassword(data) {
		return request('/auth/reset-password', { method: 'POST', data });
	},
};

export const patientApi = {
	register(data) {
		return request('/patients/register', { method: 'POST', data });
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
	listRecords(token, filters) {
		return request('/patients/medical-records', { method: 'GET', token, params: filters });
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
	serviceDetail(serviceId) {
		return request(`/guests/services/${serviceId}`);
	},
};

export { request };
