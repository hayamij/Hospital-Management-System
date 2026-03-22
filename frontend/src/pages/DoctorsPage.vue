<template>
  <section class="page">
    <header class="page__header">
      <h1>Doctors</h1>
      <small>Search, schedule, and communication</small>
    </header>

    <div class="panel two-col">
      <DoctorSearch v-model="searchQuery" :doctors="doctors" @change="onSearch" />
      <DoctorProfileForm v-model="updateForm" :loading="loading" @submit="onUpdateProfile" />
    </div>

    <div class="panel two-col">
      <DoctorScheduleTable :schedule="schedule" v-model:doctorId="scheduleDoctorId" @change="onScheduleChange" />
      <DoctorMessageForm v-model="messageForm" :loading="loading" :last-message="lastMessage" @submit="onSendMessage" />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DoctorMessageForm from '../components/doctors/DoctorMessageForm.vue';
import DoctorProfileForm from '../components/doctors/DoctorProfileForm.vue';
import DoctorScheduleTable from '../components/doctors/DoctorScheduleTable.vue';
import DoctorSearch from '../components/doctors/DoctorSearch.vue';
import { useDoctorsStore } from '../stores/doctors.js';

const store = useDoctorsStore();

const searchQuery = ref('');
const updateForm = reactive({ id: 'doc-1', name: '', specialty: '', availability: '' });
const scheduleDoctorId = ref('doc-1');
const messageForm = reactive({ patientId: 'pat-1', text: '' });
const lastMessage = ref(null);

const loading = computed(() => store.loading);
const doctors = computed(() => store.doctors);
const schedule = computed(() => store.schedule);

const onSearch = async (q) => { await store.searchDoctors(q); };
const onScheduleChange = async (doctorId) => { await store.viewDoctorSchedule(doctorId); };

const onUpdateProfile = async ({ id, profile, slotsPerDay }) => {
  await store.updateDoctorProfileAndAvailability(id, { profile, slotsPerDay });
  await store.searchDoctors(searchQuery.value);
};

const onSendMessage = async ({ patientId, text }) => {
  lastMessage.value = await store.sendDoctorMessage(patientId, text, scheduleDoctorId.value);
};

watch(searchQuery, onSearch, { immediate: true });
watch(scheduleDoctorId, onScheduleChange, { immediate: true });
onMounted(() => onScheduleChange(scheduleDoctorId.value));
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
