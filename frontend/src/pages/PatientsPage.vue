<template>
  <section class="page">
    <header class="page__header">
      <h1>Patients</h1>
      <small>Registration, profile, and messaging</small>
    </header>

    <div class="panel two-col">
      <PatientRegisterForm v-model="registerForm" :loading="loading" :last-registered="lastRegistered" @submit="onRegister" />
      <PatientProfileForm v-model="updateForm" :loading="loading" @submit="onUpdateProfile" />
    </div>

    <div class="panel two-col">
      <PatientMessageForm v-model="messageForm" :loading="loading" :last-message="lastMessage" @submit="onSendMessage" />
      <PatientsList :patients="patients" />
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import PatientMessageForm from '../components/patients/PatientMessageForm.vue';
import PatientProfileForm from '../components/patients/PatientProfileForm.vue';
import PatientRegisterForm from '../components/patients/PatientRegisterForm.vue';
import PatientsList from '../components/patients/PatientsList.vue';
import { usePatientsStore } from '../stores/patients.js';

const store = usePatientsStore();

const registerForm = reactive({ name: '', age: '', phone: '' });
const updateForm = reactive({ id: 'pat-1', age: '', phone: '' });
const messageForm = reactive({ patientId: 'pat-1', doctorId: 'doc-1', text: '' });

const lastRegistered = ref(null);
const lastMessage = ref(null);

const loading = computed(() => store.loading);
const patients = computed(() => store.patients);

const onRegister = async (payload) => { lastRegistered.value = await store.registerPatientAccount(payload); };
const onUpdateProfile = async (payload) => { await store.updatePatientProfile(payload.id, { age: payload.age, phone: payload.phone }); };
const onSendMessage = async (payload) => { lastMessage.value = await store.sendPatientMessage(payload); };
</script>

<style scoped>
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

input,
textarea,
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

.list {
  display: grid;
  gap: 0.35rem;
  padding: 0;
  list-style: none;
}
</style>
