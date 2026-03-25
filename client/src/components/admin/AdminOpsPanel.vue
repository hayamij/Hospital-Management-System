<template>
  <div class="page">
    <header class="panel">
      <h1>Admin Operations</h1>
      <p>Execute admin usecases: users, schedules, billing, services, settings, reports and audit.</p>
    </header>

    <UserManagement />

    <section class="panel">
      <h2>Doctor schedule and appointment override</h2>
      <form class="grid four" @submit.prevent="$emit('update-doctor-schedule')">
        <input v-model="scheduleOps.doctorId" placeholder="Doctor ID" required />
        <input v-model.number="scheduleOps.slotsPerDay" type="number" min="0" placeholder="Slots per day" required />
        <button type="submit">Update doctor schedule</button>
      </form>
      <form class="grid five" @submit.prevent="$emit('override-appointment')">
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
      <form class="grid four" @submit.prevent="$emit('upsert-service')">
        <input v-model="serviceOps.id" placeholder="Service ID" />
        <input v-model="serviceOps.name" placeholder="Service name" required />
        <input v-model.number="serviceOps.price" type="number" min="0" placeholder="Price" required />
        <button type="submit">Upsert service</button>
      </form>
      <form class="grid three" @submit.prevent="$emit('update-settings')">
        <input v-model="settingsOps.clinicName" placeholder="Clinic name" required />
        <input v-model="settingsOps.timezone" placeholder="Timezone" required />
        <button type="submit">Update settings</button>
      </form>
      <form class="grid three" @submit.prevent="$emit('run-report')">
        <input v-model="reportOps.reportName" placeholder="Report name" required />
        <input v-model="reportOps.from" type="date" />
        <input v-model="reportOps.to" type="date" />
        <button type="submit">Run report</button>
      </form>
      <pre class="pre">{{ prettyReport(reportResult) }}</pre>
    </section>

    <section class="panel">
      <h2>Billing and medical record audit</h2>
      <form class="grid four" @submit.prevent="$emit('manage-billing')">
        <input v-model="billingOps.invoiceId" placeholder="Invoice ID" required />
        <input v-model="billingOps.action" placeholder="Action (issue/markPaid/void)" required />
        <input v-model="billingOps.dueDate" type="date" />
        <button type="submit">Apply billing action</button>
      </form>
      <form class="grid three" @submit.prevent="$emit('audit-record')">
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
import UserManagement from './UserManagement.vue';

defineProps({
  scheduleOps: { type: Object, required: true },
  overrideOps: { type: Object, required: true },
  serviceOps: { type: Object, required: true },
  settingsOps: { type: Object, required: true },
  reportOps: { type: Object, required: true },
  billingOps: { type: Object, required: true },
  auditOps: { type: Object, required: true },
  reportResult: { type: [Object, Array, String, Number, Boolean], default: null },
  status: { type: String, default: '' },
  error: { type: String, default: '' },
  prettyReport: { type: Function, required: true },
});

defineEmits([
  'update-doctor-schedule',
  'override-appointment',
  'upsert-service',
  'update-settings',
  'run-report',
  'manage-billing',
  'audit-record',
]);
</script>

<style scoped>
.four { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.five { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.pre { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; max-height: 320px; overflow: auto; }
</style>
