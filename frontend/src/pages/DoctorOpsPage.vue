<template>
  <div class="page">
    <header class="panel">
      <h1>Doctor Operations</h1>
      <p>Doctor-only workspace: schedule, appointment decisions, and lab reviews.</p>
      <button type="button" @click="loadSchedule">Refresh schedule</button>
    </header>

    <section class="panel">
      <h2>Today schedule</h2>
      <div v-if="schedule.length === 0">No appointments found.</div>
      <div class="list-grid">
        <article v-for="item in schedule" :key="item.id || item.appointmentId" class="item">
          <p><strong>{{ item.reason || 'Appointment' }}</strong></p>
          <p>{{ item.startAt }} -> {{ item.endAt }}</p>
          <p>Status: {{ item.status }}</p>
          <p>Patient: {{ item.patientId || '-' }}</p>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2>Appointment decision</h2>
      <form class="grid two" @submit.prevent="applyDecision">
        <input v-model="decisionForm.appointmentId" required placeholder="Appointment ID" />
        <select v-model="decisionForm.decision">
          <option value="approved">Approve</option>
          <option value="rejected">Reject</option>
        </select>
        <button type="submit">Apply decision</button>
      </form>
    </section>

    <section class="panel">
      <h2>Review lab result</h2>
      <form class="grid two" @submit.prevent="reviewLab">
        <input v-model="labForm.labResultId" required placeholder="Lab result ID" />
        <input v-model="labForm.notes" required placeholder="Notes" />
        <button type="submit">Submit review</button>
      </form>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { doctorApi } from '../services/api.js';

const auth = useAuthStore();
const schedule = ref([]);
const status = ref('');
const error = ref('');

const decisionForm = reactive({ appointmentId: '', decision: 'approved' });
const labForm = reactive({ labResultId: '', notes: '' });

const safeRun = async (fn, successMessage = '') => {
  error.value = '';
  status.value = '';
  try {
    await fn();
    status.value = successMessage;
  } catch (e) {
    error.value = e.message || 'Request failed';
  }
};

const loadSchedule = () =>
  safeRun(async () => {
    const res = await doctorApi.getSchedule(auth.token, { doctorId: auth.userId });
    schedule.value = res.appointments || [];
  });

const applyDecision = () =>
  safeRun(async () => {
    await doctorApi.updateAppointmentDecision(auth.token, decisionForm.appointmentId, {
      decision: decisionForm.decision,
      doctorId: auth.userId,
    });
    await loadSchedule();
  }, 'Decision updated.');

const reviewLab = () =>
  safeRun(async () => {
    await doctorApi.reviewLabResult(auth.token, labForm.labResultId, {
      notes: labForm.notes,
      doctorId: auth.userId,
    });
  }, 'Lab result reviewed.');

onMounted(loadSchedule);
</script>

<style scoped>
.two {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
</style>