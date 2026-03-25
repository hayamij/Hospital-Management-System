<template>
  <AdminOpsPanel
    :schedule-ops="scheduleOps"
    :override-ops="overrideOps"
    :service-ops="serviceOps"
    :settings-ops="settingsOps"
    :report-ops="reportOps"
    :billing-ops="billingOps"
    :audit-ops="auditOps"
    :report-result="reportResult"
    :status="status"
    :error="error"
    :pretty-report="prettyReport"
    @update-doctor-schedule="updateDoctorSchedule"
    @override-appointment="overrideAppointment"
    @upsert-service="upsertService"
    @update-settings="updateSettings"
    @run-report="runReport"
    @manage-billing="manageBilling"
    @audit-record="auditRecord"
  />
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { adminApi } from '../services/api.js';
import AdminOpsPanel from '../components/admin/AdminOpsPanel.vue';
import {
  buildBillingPayload,
  buildOverridePayload,
  buildServicePayload,
  prettyReport,
  withFeedback,
} from './controllers/adminOpsController.js';

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

const updateDoctorSchedule = () =>
  withFeedback(
    {
      run: () =>
        adminApi.manageDoctorSchedule(auth.token, scheduleOps.doctorId, {
          slotsPerDay: scheduleOps.slotsPerDay,
          adminId: auth.userId,
        }),
      setStatus: (message) => (status.value = message),
      setError: (message) => (error.value = message),
      successText: 'Doctor schedule updated successfully.',
    }
  );

const overrideAppointment = () =>
  withFeedback(
    {
      run: () =>
        adminApi.overrideAppointment(
          auth.token,
          overrideOps.appointmentId,
          buildOverridePayload(overrideOps, auth.userId)
        ),
      setStatus: (message) => (status.value = message),
      setError: (message) => (error.value = message),
      successText: 'Appointment override applied.',
    }
  );

const upsertService = () =>
  withFeedback(
    {
      run: () => adminApi.upsertService(auth.token, buildServicePayload(serviceOps, auth.userId)),
      setStatus: (message) => (status.value = message),
      setError: (message) => (error.value = message),
      successText: 'Service updated successfully.',
    }
  );

const updateSettings = () =>
  withFeedback(
    {
      run: () => adminApi.updateSettings(auth.token, { ...settingsOps, adminId: auth.userId }),
      setStatus: (message) => (status.value = message),
      setError: (message) => (error.value = message),
      successText: 'Settings updated successfully.',
    }
  );

const runReport = () =>
  withFeedback({
    run: async () => {
      reportResult.value = await adminApi.runReport(auth.token, reportOps);
    },
    setStatus: (message) => (status.value = message),
    setError: (message) => (error.value = message),
    successText: 'Report generated successfully.',
  });

const manageBilling = () =>
  withFeedback(
    {
      run: () =>
        adminApi.manageBilling(
          auth.token,
          billingOps.invoiceId,
          buildBillingPayload(billingOps, auth.userId)
        ),
      setStatus: (message) => (status.value = message),
      setError: (message) => (error.value = message),
      successText: 'Billing action completed.',
    }
  );

const auditRecord = () =>
  withFeedback(
    {
      run: () =>
        adminApi.auditMedicalRecord(auth.token, auditOps.recordId, {
          action: auditOps.action,
          reason: auditOps.reason,
          adminId: auth.userId,
        }),
      setStatus: (message) => (status.value = message),
      setError: (message) => (error.value = message),
      successText: 'Medical record audit submitted.',
    }
  );
</script>
