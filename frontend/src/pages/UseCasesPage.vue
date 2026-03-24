<template>
  <div class="usecases-page">
    <h1>Hospital Management - First Version Use Cases Console</h1>
    <p>
      Minimal interface to execute all available adapter endpoints.
      No fancy style. Pure function coverage.
    </p>

    <section class="box">
      <h2>Authorization</h2>
      <p>For protected routes, put Bearer token value below.</p>
      <input v-model="authToken" type="text" placeholder="JWT token or dev token (example: admin-token, doctor-token, mock-token)" />
      <div class="token-buttons">
        <button type="button" @click="setToken('admin-token')">Use admin-token</button>
        <button type="button" @click="setToken('doctor-token')">Use doctor-token</button>
        <button type="button" @click="setToken('mock-token')">Use mock-token</button>
        <button type="button" @click="setToken('')">Clear token</button>
      </div>
    </section>

    <section v-for="group in groups" :key="group.name" class="box">
      <h2>{{ group.name }}</h2>
      <div v-for="action in group.actions" :key="action.id" class="action">
        <h3>{{ action.title }}</h3>
        <p><strong>{{ action.method }}</strong> {{ action.path }}</p>
        <p v-if="action.secured">Requires role: {{ action.role }}</p>

        <div v-if="action.pathParams.length" class="field-grid">
          <label v-for="param in action.pathParams" :key="param">
            Path {{ param }}
            <input v-model="states[action.id].pathParams[param]" type="text" />
          </label>
        </div>

        <label>
          Query JSON
          <textarea v-model="states[action.id].queryText" rows="3"></textarea>
        </label>

        <label>
          Body JSON
          <textarea v-model="states[action.id].bodyText" rows="6"></textarea>
        </label>

        <div class="action-buttons">
          <button type="button" @click="execute(action)">Execute</button>
          <button type="button" @click="resetAction(action)">Reset</button>
        </div>

        <p v-if="states[action.id].error" class="error">{{ states[action.id].error }}</p>
        <pre v-if="states[action.id].responseText">{{ states[action.id].responseText }}</pre>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { request } from '../services/api.js';

const TOKEN_KEY = 'hms.usecases.token';
const authToken = ref(localStorage.getItem(TOKEN_KEY) || '');

watch(authToken, (value) => {
  localStorage.setItem(TOKEN_KEY, value || '');
});

const groups = [
  {
    name: 'Auth',
    actions: [
      { id: 'auth-login', title: 'Login', method: 'POST', path: '/auth/login', body: { email: 'patient@example.com', password: '123456' } },
      { id: 'auth-logout', title: 'Logout', method: 'POST', path: '/auth/logout', body: {} },
      { id: 'auth-reset-password', title: 'Reset Password', method: 'POST', path: '/auth/reset-password', body: { email: 'patient@example.com', oldPassword: '123456', newPassword: '654321' } },
    ],
  },
  {
    name: 'Guest',
    actions: [
      { id: 'guest-public-info', title: 'Browse Public Info', method: 'GET', path: '/guests/public-info' },
      { id: 'guest-service-detail', title: 'View Public Service Detail', method: 'GET', path: '/guests/services/:serviceId' },
      { id: 'guest-search-doctors', title: 'Guest Search Doctors', method: 'GET', path: '/guests/doctors/search', query: { q: 'an', specialization: 'cardiology' } },
      { id: 'guest-registration', title: 'Start Registration', method: 'POST', path: '/guests/registration', body: { fullName: 'Guest User', email: 'guest@example.com', phone: '0123', note: 'Interested in appointment' } },
      { id: 'guest-contact', title: 'Submit Contact', method: 'POST', path: '/guests/contact', body: { fullName: 'Guest Contact', phone: '0987', email: 'guest@mail.com', message: 'Need consultation' } },
      { id: 'guest-slots', title: 'View Available Slots', method: 'GET', path: '/guests/doctors/:doctorId/available-slots', query: { from: '2026-03-24', to: '2026-03-31' } },
    ],
  },
  {
    name: 'Patient',
    actions: [
      { id: 'patient-register', title: 'Register Patient Account', method: 'POST', path: '/patients/register', body: { fullName: 'Patient Demo', email: 'patient@example.com', password: '123456', phone: '000111' } },
      { id: 'patient-search-doctors', title: 'Search Doctors', method: 'GET', path: '/patients/doctors/search', query: { q: 'doctor', specialty: 'general', page: 1, pageSize: 10 } },
      { id: 'patient-schedule', title: 'Schedule Appointment', method: 'POST', path: '/patients/appointments', secured: true, role: 'patient', body: { patientId: 'p1', doctorId: 'd1', startAt: '2026-03-26T08:00:00Z', endAt: '2026-03-26T08:30:00Z', reason: 'Checkup' } },
      { id: 'patient-reschedule', title: 'Reschedule Appointment', method: 'PUT', path: '/patients/appointments/:id', secured: true, role: 'patient', body: { patientId: 'p1', startAt: '2026-03-27T08:00:00Z', endAt: '2026-03-27T08:30:00Z' } },
      { id: 'patient-cancel', title: 'Cancel Appointment', method: 'DELETE', path: '/patients/appointments/:id', secured: true, role: 'patient', body: { patientId: 'p1' } },
      { id: 'patient-view-appointments', title: 'View Appointments', method: 'GET', path: '/patients/appointments', secured: true, role: 'patient', query: { patientId: 'p1', page: 1, pageSize: 20 } },
      { id: 'patient-view-billing', title: 'View Billing and Payments', method: 'GET', path: '/patients/billing', secured: true, role: 'patient', query: { patientId: 'p1', page: 1, pageSize: 20 } },
      { id: 'patient-view-records', title: 'View Medical Records', method: 'GET', path: '/patients/medical-records', secured: true, role: 'patient', query: { patientId: 'p1', page: 1, pageSize: 20 } },
      { id: 'patient-download-prescription', title: 'Download Prescription', method: 'GET', path: '/patients/prescriptions/:id/download', secured: true, role: 'patient', query: { patientId: 'p1' } },
      { id: 'patient-message', title: 'Send Patient Message', method: 'POST', path: '/patients/messages', secured: true, role: 'patient', body: { patientId: 'p1', doctorId: 'd1', subject: 'Question', message: 'Need advice' } },
      { id: 'patient-update-profile', title: 'Update Patient Profile', method: 'PUT', path: '/patients/profile', secured: true, role: 'patient', body: { patientId: 'p1', name: 'Patient Name', phone: '0123', address: 'HCM City', dateOfBirth: '2000-01-01', emergencyContact: 'Mom' } },
    ],
  },
  {
    name: 'Doctor',
    actions: [
      { id: 'doctor-login', title: 'Doctor Login', method: 'POST', path: '/doctors/login', body: { email: 'doctor@example.com', password: '123456' } },
      { id: 'doctor-schedule', title: 'View Doctor Schedule', method: 'GET', path: '/doctors/schedule', secured: true, role: 'doctor', query: { doctorId: 'd1', from: '2026-03-24', to: '2026-03-31' } },
      { id: 'doctor-decision', title: 'Manage Appointment Decision', method: 'POST', path: '/doctors/appointments/:appointmentId/decision', secured: true, role: 'doctor', body: { doctorId: 'd1', decision: 'accept', reason: 'ok' } },
      { id: 'doctor-status', title: 'Mark Appointment Status', method: 'POST', path: '/doctors/appointments/:appointmentId/status', secured: true, role: 'doctor', body: { doctorId: 'd1', status: 'completed' } },
      { id: 'doctor-chart', title: 'Access Patient Chart', method: 'GET', path: '/doctors/patients/:patientId/chart', secured: true, role: 'doctor', query: { doctorId: 'd1' } },
      { id: 'doctor-add-note', title: 'Add Visit Note', method: 'POST', path: '/doctors/patients/:patientId/visit-notes', secured: true, role: 'doctor', body: { doctorId: 'd1', note: 'Patient is stable' } },
      { id: 'doctor-update-entry', title: 'Update Medical Record Entry', method: 'POST', path: '/doctors/records/:recordId/entries', secured: true, role: 'doctor', body: { doctorId: 'd1', note: 'Updated record entry' } },
      { id: 'doctor-review-lab', title: 'Review Test Results', method: 'POST', path: '/doctors/lab-results/:labResultId/review', secured: true, role: 'doctor', body: { doctorId: 'd1', notes: 'Lab result reviewed' } },
      { id: 'doctor-profile', title: 'Update Doctor Profile', method: 'PUT', path: '/doctors/profile', secured: true, role: 'doctor', body: { doctorId: 'd1', profile: { fullName: 'Doctor Name', specialization: 'general' }, slotsPerDay: 10 } },
      { id: 'doctor-message', title: 'Send Doctor Message', method: 'POST', path: '/doctors/messages', secured: true, role: 'doctor', body: { doctorId: 'd1', patientId: 'p1', content: 'Please follow up' } },
    ],
  },
  {
    name: 'Admin',
    actions: [
      { id: 'admin-login', title: 'Admin Login', method: 'POST', path: '/admin/login', body: { email: 'admin@example.com', password: '123456' } },
      { id: 'admin-assign-role', title: 'Assign Roles', method: 'POST', path: '/admin/users/:userId/roles', secured: true, role: 'admin', body: { adminId: 'a1', role: 'doctor' } },
      { id: 'admin-user-status', title: 'Manage User Status', method: 'PATCH', path: '/admin/users/:userId/status', secured: true, role: 'admin', body: { adminId: 'a1', action: 'deactivate' } },
      { id: 'admin-doctor-schedule', title: 'Manage Doctor Schedules', method: 'PUT', path: '/admin/doctors/:doctorId/schedule', secured: true, role: 'admin', body: { adminId: 'a1', slotsPerDay: 12 } },
      { id: 'admin-override-appointment', title: 'Override Appointment', method: 'POST', path: '/admin/appointments/:appointmentId/override', secured: true, role: 'admin', body: { adminId: 'a1', action: 'cancel' } },
      { id: 'admin-billing', title: 'Manage Billing', method: 'POST', path: '/admin/billing/:invoiceId/action', secured: true, role: 'admin', body: { adminId: 'a1', action: 'issue', dueDate: '2026-04-10' } },
      { id: 'admin-upsert-service', title: 'Configure Services/Pricing - Upsert', method: 'POST', path: '/admin/services', secured: true, role: 'admin', body: { adminId: 'a1', action: 'upsert', service: { id: 'svc1', name: 'X-Ray', price: 50 } } },
      { id: 'admin-remove-service', title: 'Configure Services/Pricing - Remove', method: 'DELETE', path: '/admin/services/:serviceId', secured: true, role: 'admin' },
      { id: 'admin-settings', title: 'Manage System Settings', method: 'PUT', path: '/admin/settings', secured: true, role: 'admin', body: { adminId: 'a1', clinicName: 'Hospital A', timezone: 'Asia/Ho_Chi_Minh' } },
      { id: 'admin-report', title: 'Run Reports', method: 'GET', path: '/admin/reports', secured: true, role: 'admin', query: { reportName: 'system_overview' } },
      { id: 'admin-audit', title: 'Audit Medical Records', method: 'POST', path: '/admin/medical-records/:recordId/audit', secured: true, role: 'admin', body: { adminId: 'a1', action: 'approve', reason: 'ok' } },
    ],
  },
];

const states = reactive({});

for (const group of groups) {
  for (const action of group.actions) {
    const params = [...action.path.matchAll(/:([a-zA-Z0-9_]+)/g)].map((m) => m[1]);
    const pathParams = {};
    for (const param of params) {
      pathParams[param] = '';
    }

    states[action.id] = {
      pathParams,
      queryText: action.query ? JSON.stringify(action.query, null, 2) : '{}',
      bodyText: action.body ? JSON.stringify(action.body, null, 2) : '{}',
      error: '',
      responseText: '',
    };

    action.pathParams = params;
  }
}

const setToken = (value) => {
  authToken.value = value;
};

const parseJson = (text, fieldName) => {
  if (!text || !text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(fieldName + ' must be valid JSON.');
  }
};

const buildPath = (action, state) => {
  let path = action.path;
  for (const param of action.pathParams) {
    const value = state.pathParams[param] || '';
    path = path.replace(':' + param, encodeURIComponent(value));
  }
  return path;
};

const execute = async (action) => {
  const state = states[action.id];
  state.error = '';
  state.responseText = '';

  try {
    const query = parseJson(state.queryText, 'Query JSON');
    const body = parseJson(state.bodyText, 'Body JSON');
    const path = buildPath(action, state);

    const response = await request(path, {
      method: action.method,
      params: query,
      data: ['GET', 'DELETE'].includes(action.method) ? undefined : body,
      token: action.secured ? authToken.value : undefined,
    });

    state.responseText = JSON.stringify(response, null, 2);
  } catch (error) {
    state.error = error?.message || 'Unknown error';
    if (error?.details) {
      state.responseText = JSON.stringify(error.details, null, 2);
    }
  }
};

const resetAction = (action) => {
  const state = states[action.id];
  state.error = '';
  state.responseText = '';
  state.queryText = action.query ? JSON.stringify(action.query, null, 2) : '{}';
  state.bodyText = action.body ? JSON.stringify(action.body, null, 2) : '{}';
  for (const param of action.pathParams) {
    state.pathParams[param] = '';
  }
};
</script>

<style scoped>
.usecases-page {
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #111;
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px;
}

.box {
  border: 1px solid #c0c0c0;
  padding: 10px;
  margin: 12px 0;
  background: #fff;
}

.action {
  border-top: 1px dashed #c0c0c0;
  padding-top: 10px;
  margin-top: 10px;
}

.action:first-of-type {
  border-top: 0;
  padding-top: 0;
  margin-top: 0;
}

h1,
h2,
h3 {
  margin: 6px 0;
}

label {
  display: block;
  margin: 8px 0;
}

input,
textarea,
button {
  font-family: Arial, sans-serif;
  font-size: 13px;
}

input,
textarea {
  width: 100%;
  padding: 6px;
  border: 1px solid #a0a0a0;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
}

button {
  padding: 4px 10px;
  border: 1px solid #555;
  background: #f0f0f0;
  cursor: pointer;
}

button:hover {
  background: #e5e5e5;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.action-buttons,
.token-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #fafafa;
  border: 1px solid #ddd;
  padding: 8px;
}

.error {
  color: #b00020;
  font-weight: 700;
}
</style>
