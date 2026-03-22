const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const buildUrl = (path, params) => {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .forEach(([key, value]) => url.searchParams.set(key, value));
  }
  // Replace origin with API base (can be relative like /api)
  return API_BASE.replace(/\/$/, '') + url.pathname + (url.search ? url.search : '');
};

const request = async (path, { method = 'GET', data, params } = {}) => {
  const url = buildUrl(path, params);
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
};

// Auth
export const login = (payload) => request('/auth/login', { method: 'POST', data: payload });
export const logout = (payload) => request('/auth/logout', { method: 'POST', data: payload });
export const resetPassword = (payload) => request('/auth/reset-password', { method: 'POST', data: payload });

// Guest
export const browsePublicInfo = () => request('/guests/public-info');
export const guestSearchDoctors = (params) => request('/guests/doctors/search', { params });
export const startRegistration = (payload) => request('/guests/registration', { method: 'POST', data: payload });
export const submitContactForm = (payload) => request('/guests/contact', { method: 'POST', data: payload });
export const viewAvailableSlots = ({ doctorId, from, to }) => request(`/guests/doctors/${doctorId}/available-slots`, { params: { from, to } });

// Patients
export const registerPatientAccount = (payload) => request('/patients/register', { method: 'POST', data: payload });
export const updatePatientProfile = (payload) => request('/patients/profile', { method: 'PUT', data: payload });
export const searchDoctors = (params) => request('/patients/doctors/search', { params });
export const scheduleAppointment = (payload) => request('/patients/appointments', { method: 'POST', data: payload });
export const rescheduleAppointment = (id, payload) => request(`/patients/appointments/${id}`, { method: 'PUT', data: payload });
export const cancelAppointment = (id, payload) => request(`/patients/appointments/${id}`, { method: 'DELETE', data: payload });
export const viewAppointments = (params) => request('/patients/appointments', { params });
export const viewBillingAndPayments = (params) => request('/patients/billing', { params });
export const viewMedicalRecords = (params) => request('/patients/medical-records', { params });
export const downloadPrescription = (id, params) => request(`/patients/prescriptions/${id}/download`, { params });
export const sendPatientMessage = (payload) => request('/patients/messages', { method: 'POST', data: payload });

// Doctors
export const doctorLogin = (payload) => request('/doctors/login', { method: 'POST', data: payload });
export const viewDoctorSchedule = (params) => request('/doctors/schedule', { params });
export const decideAppointment = (appointmentId, payload) => request(`/doctors/appointments/${appointmentId}/decision`, { method: 'POST', data: payload });
export const markAppointmentStatus = (appointmentId, payload) => request(`/doctors/appointments/${appointmentId}/status`, { method: 'POST', data: payload });
export const accessPatientChart = ({ patientId, doctorId }) => request(`/doctors/patients/${patientId}/chart`, { params: { doctorId } });
export const addVisitNote = (patientId, payload) => request(`/doctors/patients/${patientId}/visit-notes`, { method: 'POST', data: payload });
export const updateMedicalRecordEntry = (recordId, payload) => request(`/doctors/records/${recordId}/entries`, { method: 'POST', data: payload });
export const reviewTestResults = (labResultId, payload) => request(`/doctors/lab-results/${labResultId}/review`, { method: 'POST', data: payload });
export const updateDoctorProfile = (payload) => request('/doctors/profile', { method: 'PUT', data: payload });
export const sendDoctorMessage = (payload) => request('/doctors/messages', { method: 'POST', data: payload });

// Admin
export const adminLogin = (payload) => request('/admin/login', { method: 'POST', data: payload });
export const assignRoles = (userId, payload) => request(`/admin/users/${userId}/roles`, { method: 'POST', data: payload });
export const manageUserStatus = (userId, payload) => request(`/admin/users/${userId}/status`, { method: 'PATCH', data: payload });
export const setDoctorSlots = (doctorId, payload) => request(`/admin/doctors/${doctorId}/schedule`, { method: 'PUT', data: payload });
export const overrideAppointment = (appointmentId, payload) => request(`/admin/appointments/${appointmentId}/override`, { method: 'POST', data: payload });
export const manageBilling = (invoiceId, payload) => request(`/admin/billing/${invoiceId}/action`, { method: 'POST', data: payload });
export const upsertService = (payload) => request('/admin/services', { method: 'POST', data: payload });
export const removeService = (serviceId) => request(`/admin/services/${serviceId}`, { method: 'DELETE' });
export const updateSettings = (payload) => request('/admin/settings', { method: 'PUT', data: payload });
export const runReport = (params) => request('/admin/reports', { params });
export const auditRecord = (recordId, payload) => request(`/admin/medical-records/${recordId}/audit`, { method: 'POST', data: payload });

export const http = { request };
