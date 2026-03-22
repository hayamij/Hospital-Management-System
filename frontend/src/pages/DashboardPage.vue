<template>
  <section class="page">
    <header class="page__header">
      <div>
        <h1>Dashboard</h1>
        <small>Snapshot across patients, doctors, appointments, billing</small>
      </div>
      <button :disabled="loading" @click="runReport">{{ loading ? 'Running…' : 'Run Report' }}</button>
    </header>

    <SummaryCards :stats="stats" :loading="loading" />
    <ReportPreview :report="lastReport" :loading="loading" />
  </section>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import SummaryCards from '../components/dashboard/SummaryCards.vue';
import ReportPreview from '../components/dashboard/ReportPreview.vue';
import { useDashboardStore } from '../stores/dashboard.js';
import { useAppointmentsStore } from '../stores/appointments.js';
import { useDoctorsStore } from '../stores/doctors.js';
import { usePatientsStore } from '../stores/patients.js';
import { useBillingStore } from '../stores/billing.js';

const dashboardStore = useDashboardStore();
const appointmentsStore = useAppointmentsStore();
const doctorsStore = useDoctorsStore();
const patientsStore = usePatientsStore();
const billingStore = useBillingStore();

const stats = computed(() => dashboardStore.stats);
const lastReport = computed(() => dashboardStore.lastReport);
const loading = computed(() => dashboardStore.loading);

const runReport = async () => {
  try {
    await dashboardStore.runReport({ span: '7d' });
  } catch (err) {
    dashboardStore.hydrateFromCollections({
      patients: patientsStore.patients,
      doctors: doctorsStore.doctors,
      appointments: appointmentsStore.items,
      billing: billingStore.items,
    });
  }
};

onMounted(runReport);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
button { padding: 0.45rem 0.75rem; border: none; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; }
button:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
