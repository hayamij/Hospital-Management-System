<template>
  <div class="page">
    <header class="panel">
      <h1>Dashboard</h1>
      <p>{{ greeting }}</p>
      <div class="actions">
        <RouterLink to="/appointments">Appointments</RouterLink>
        <RouterLink to="/records">Records</RouterLink>
        <button type="button" @click="reload">Reload</button>
      </div>
    </header>

    <section class="grid stats">
      <article class="panel">
        <h2>Upcoming appointments</h2>
        <strong>{{ snapshot.upcomingAppointments.length }}</strong>
      </article>
      <article class="panel">
        <h2>Invoices</h2>
        <strong>{{ snapshot.invoices.length }}</strong>
      </article>
      <article class="panel">
        <h2>Records</h2>
        <strong>{{ snapshot.records.length }}</strong>
      </article>
    </section>

    <section class="grid two-col">
      <article class="panel">
        <h2>Recent appointments</h2>
        <ul v-if="snapshot.upcomingAppointments.length" class="list">
          <li v-for="item in snapshot.upcomingAppointments" :key="item.id || item.appointmentId">
            <strong>{{ item.reason || 'Appointment' }}</strong>
            <p>{{ item.startAt }} -> {{ item.endAt }}</p>
            <small>Status: {{ item.status }}</small>
          </li>
        </ul>
        <p v-else>No appointments found.</p>
      </article>

      <article class="panel">
        <h2>Recent invoices</h2>
        <ul v-if="snapshot.invoices.length" class="list">
          <li v-for="invoice in snapshot.invoices" :key="invoice.id || invoice.invoiceNumber">
            <strong>Invoice {{ invoice.invoiceNumber || invoice.id }}</strong>
            <p>Status: {{ invoice.status }}</p>
          </li>
        </ul>
        <p v-else>No invoices found.</p>
      </article>
    </section>

    <p v-if="dashboard.error" class="msg err">{{ dashboard.error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useDashboardStore } from '../stores/dashboard.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const dashboard = useDashboardStore();

const snapshot = computed(() => dashboard.snapshot || { upcomingAppointments: [], invoices: [], records: [] });
const greeting = computed(() => {
	if (!auth.role) return 'Hello guest';
	return `Hello ${auth.role}`;
});

onMounted(() => {
	dashboard.load();
});

const reload = () => {
  dashboard.load();
};
</script>

<style scoped>
.actions { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; }
.actions a, .actions button { color: #111827; text-decoration: none; }
.stats { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.two-col { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.list { margin: 0; padding-left: 18px; }
.list li { margin: 12px 0; }
</style>
