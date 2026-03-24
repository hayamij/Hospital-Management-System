<template>
  <div class="page">
    <header class="panel">
      <h1>Communications</h1>
      <p>Send secure messages and review lab result notes.</p>
    </header>

    <section class="panel">
      <h2>Send message</h2>
      <form class="grid two" @submit.prevent="sendMessage">
        <input v-if="auth.role === 'patient'" v-model="payload.doctorId" required placeholder="Doctor ID" />
        <input v-if="auth.role === 'doctor'" v-model="payload.patientId" required placeholder="Patient ID" />
        <input v-if="auth.role === 'patient'" v-model="payload.subject" placeholder="Subject" />
        <textarea v-model="payload.message" required rows="4" :placeholder="auth.role === 'doctor' ? 'Message content' : 'Message body'"></textarea>
        <button type="submit">Send</button>
      </form>
    </section>

    <section class="panel">
      <h2>Doctor lab review</h2>
      <form v-if="auth.role === 'doctor'" class="grid two" @submit.prevent="reviewLabResult">
        <input v-model="labReview.labResultId" required placeholder="Lab result ID" />
        <input v-model="labReview.notes" required placeholder="Review notes" />
        <button type="submit">Submit review</button>
      </form>
      <p v-else>Lab review is available only for doctor role.</p>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { doctorApi, patientApi } from '../services/api.js';

const auth = useAuthStore();
const status = ref('');
const error = ref('');

const payload = reactive({ doctorId: '', patientId: '', subject: '', message: '' });
const labReview = reactive({ labResultId: '', notes: '' });

const sendMessage = async () => {
  error.value = '';
  status.value = '';

  if (auth.role === 'patient') {
    await patientApi.sendMessage(auth.token, {
      patientId: auth.userId,
      doctorId: payload.doctorId,
      subject: payload.subject,
      message: payload.message,
    });
  }

  if (auth.role === 'doctor') {
    await doctorApi.sendMessage(auth.token, {
      doctorId: auth.userId,
      patientId: payload.patientId,
      content: payload.message,
    });
  }

  status.value = 'Message sent successfully.';
};

const reviewLabResult = async () => {
  error.value = '';
  status.value = '';
  await doctorApi.reviewLabResult(auth.token, labReview.labResultId, {
    notes: labReview.notes,
    doctorId: auth.userId,
  });
  status.value = 'Lab result reviewed successfully.';
};
</script>

<style scoped>
.two { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
</style>
