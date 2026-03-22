<template>
  <section class="page">
    <header class="page__header">
      <h1>Appointments</h1>
      <small>Schedule, reschedule, cancel, and review</small>
    </header>

    <ScheduleForm
      v-model="scheduleForm"
      :last-scheduled="lastScheduled"
      :loading="loading"
      @submit="onSchedule"
    />

    <div class="panel two-col">
      <RescheduleForm v-model="rescheduleForm" :loading="loading" @submit="onReschedule" />
      <CancelAction v-model="cancelId" :loading="loading" @submit="onCancel" />
    </div>

    <div class="panel two-col">
      <DecisionForm v-model="decisionForm" :loading="loading" @submit="onDecision" />
      <AppointmentFilters v-model="filter" @change="onFilterChange" />
    </div>

    <AppointmentTable :appointments="filteredAppointments" />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import AppointmentFilters from '../components/appointments/AppointmentFilters.vue';
import AppointmentTable from '../components/appointments/AppointmentTable.vue';
import CancelAction from '../components/appointments/CancelAction.vue';
import DecisionForm from '../components/appointments/DecisionForm.vue';
import RescheduleForm from '../components/appointments/RescheduleForm.vue';
import ScheduleForm from '../components/appointments/ScheduleForm.vue';
import { useAppointmentsStore } from '../stores/appointments.js';

const store = useAppointmentsStore();

const scheduleForm = reactive({ patientId: 'pat-1', doctorId: 'doc-1', startAt: '', endAt: '', reason: '' });
const rescheduleForm = reactive({ id: 'app-1', startAt: '', endAt: '' });
const cancelId = ref('app-1');
const decisionForm = reactive({ id: 'app-1', decision: 'approved' });
const filter = reactive({ patientId: '', doctorId: '' });
const lastScheduled = ref(null);

const loading = computed(() => store.loading);

const loadAppointments = async () => {
  await store.viewAppointments({ ...filter });
};

const onSchedule = async () => {
  lastScheduled.value = await store.scheduleAppointment({
    patientId: scheduleForm.patientId,
    doctorId: scheduleForm.doctorId,
    startAt: scheduleForm.startAt,
    endAt: scheduleForm.endAt,
    reason: scheduleForm.reason,
  });
  await loadAppointments();
};

const onReschedule = async ({ id, startAt, endAt }) => {
  await store.rescheduleAppointment(id, startAt, endAt);
  await loadAppointments();
};

const onCancel = async (id) => {
  await store.cancelAppointment(id);
  await loadAppointments();
};

const onDecision = async ({ id, decision }) => {
  await store.manageAppointmentDecision(id, decision);
};

const onFilterChange = async () => {
  await loadAppointments();
};

const filteredAppointments = computed(() => store.items.filter((a) => {
  if (filter.patientId && a.patientId !== filter.patientId) return false;
  if (filter.doctorId && a.doctorId !== filter.doctorId) return false;
  return true;
}));

watch(filter, onFilterChange, { deep: true });
onMounted(loadAppointments);
</script>

<style>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.form {
  display: grid;
  gap: 0.5rem;
}

.form--inline {
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
}

input,
select,
button {
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

button {
  background: #2563eb;
  color: #fff;
  border: none;
  cursor: pointer;
}

button.danger {
  background: #dc2626;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}
</style>
