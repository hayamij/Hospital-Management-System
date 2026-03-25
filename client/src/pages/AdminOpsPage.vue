<template>
  <div class="page">
    <header class="panel">
      <h1>Admin Operations</h1>
      <p>Execute admin usecases: users, schedules, billing, services, settings, reports and audit.</p>
    </header>

    <UserManagement />

    <section class="panel">
      <h2>Doctor schedule and appointment override</h2>
      <form class="grid four" @submit.prevent="updateDoctorSchedule">
        <input v-model="scheduleOps.doctorId" placeholder="Doctor ID" required />
        <input v-model.number="scheduleOps.slotsPerDay" type="number" min="0" placeholder="Slots per day" required />
        <button type="submit">Update doctor schedule</button>
      </form>
      <form class="grid five" @submit.prevent="overrideAppointment">
        <input v-model="overrideOps.appointmentId" placeholder="Appointment ID" required />
        <input v-model="overrideOps.action" placeholder="Action (reschedule/cancel/assignDoctor)" required />
        <input v-model="overrideOps.startAt" type="datetime-local" />
        <input v-model="overrideOps.endAt" type="datetime-local" />
        <input v-model="overrideOps.doctorId" placeholder="Doctor ID (optional)" />
        <button type="submit">Override appointment</button>
      </form>
    </section>

    <section class="panel">
      <h2>Services, settings, and reports</h2>
      <form class="grid four" @submit.prevent="upsertService">
        <input v-model="serviceOps.id" placeholder="Service ID" />
        <input v-model="serviceOps.name" placeholder="Service name" required />
        <input v-model.number="serviceOps.price" type="number" min="0" placeholder="Price" required />
        <button type="submit">Upsert service</button>
      </form>
      <form class="grid three" @submit.prevent="updateSettings">
        <input v-model="settingsOps.clinicName" placeholder="Clinic name" required />
        <input v-model="settingsOps.timezone" placeholder="Timezone" required />
        <button type="submit">Update settings</button>
      </form>
      <form class="grid three" @submit.prevent="runReport">
        <input v-model="reportOps.reportName" placeholder="Report name" required />
        <input v-model="reportOps.from" type="date" />
        <input v-model="reportOps.to" type="date" />
        <button type="submit">Run report</button>
      </form>
      <pre class="pre">{{ pretty(reportResult) }}</pre>
    </section>

    <section class="panel">
      <h2>Billing and medical record audit</h2>
      <form class="grid four" @submit.prevent="manageBilling">
        <input v-model="billingOps.invoiceId" placeholder="Invoice ID" required />
        <input v-model="billingOps.action" placeholder="Action (issue/markPaid/void)" required />
        <input v-model="billingOps.dueDate" type="date" />
        <button type="submit">Apply billing action</button>
      </form>
      <form class="grid three" @submit.prevent="auditRecord">
        <input v-model="auditOps.recordId" placeholder="Record ID" required />
        <input v-model="auditOps.action" placeholder="Action (approve/reject)" required />
        <input v-model="auditOps.reason" placeholder="Reason" />
        <button type="submit">Submit audit</button>
      </form>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { adminApi } from '../services/api.js';
import UserManagement from '../components/admin/UserManagement.vue';

const auth = useAuthStore();
const status = ref('');
const error = ref('');
const reportResult = ref(null);

const scheduleOps = reactive({ doctorId: '', slotsPerDay: 12 });
const overrideOps = reactive({ appointmentId: '', action: 'cancel', startAt: '', endAt: '', doctorId: '' });
const serviceOps = reactive({ id: '', name: '', price: 0 });
const settingsOps = reactive({ clinicName: 'Hospital', timezone: 'Asia/Ho_Chi_Minh' });
const reportOps = reactive({ reportName: 'system_overview', from: '', to: '' });
const billingOps = reactive({ invoiceId: '', action: 'issue', dueDate: '' });
const auditOps = reactive({ recordId: '', action: 'approve', reason: '' });

const pretty = (value) => (value ? JSON.stringify(value, null, 2) : 'No report generated yet.');

const withFeedback = async (action, successText) => {
  error.value = '';
  status.value = '';
  try {
    await action();
    status.value = successText;
  } catch (e) {
    error.value = e.message;
  }
};

const updateDoctorSchedule = () =>
  withFeedback(
    () => adminApi.manageDoctorSchedule(auth.token, scheduleOps.doctorId, { slotsPerDay: scheduleOps.slotsPerDay, adminId: auth.userId }),
    'Doctor schedule updated successfully.'
  );

const overrideAppointment = () =>
  withFeedback(
    () =>
      adminApi.overrideAppointment(auth.token, overrideOps.appointmentId, {
        action: overrideOps.action,
        startAt: overrideOps.startAt || undefined,
        endAt: overrideOps.endAt || undefined,
        doctorId: overrideOps.doctorId || undefined,
        adminId: auth.userId,
      }),
    'Appointment override applied.'
  );

const upsertService = () =>
  withFeedback(
    () =>
      adminApi.upsertService(auth.token, {
        action: 'upsert',
        adminId: auth.userId,
        service: { id: serviceOps.id || undefined, name: serviceOps.name, price: serviceOps.price },
      }),
    'Service updated successfully.'
  );

const updateSettings = () =>
  withFeedback(
    () => adminApi.updateSettings(auth.token, { ...settingsOps, adminId: auth.userId }),
    'Settings updated successfully.'
  );

const runReport = () =>
  withFeedback(async () => {
    reportResult.value = await adminApi.runReport(auth.token, reportOps);
  }, 'Report generated successfully.');

const manageBilling = () =>
  withFeedback(
    () =>
      adminApi.manageBilling(auth.token, billingOps.invoiceId, {
        action: billingOps.action,
        dueDate: billingOps.dueDate || undefined,
        adminId: auth.userId,
      }),
    'Billing action completed.'
  );

const auditRecord = () =>
  withFeedback(
    () =>
      adminApi.auditMedicalRecord(auth.token, auditOps.recordId, {
        action: auditOps.action,
        reason: auditOps.reason,
        adminId: auth.userId,
      }),
    'Medical record audit submitted.'
  );
</script>

<style scoped>
.four { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.five { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.pre { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; max-height: 320px; overflow: auto; }
</style>
