<template>
  <div class="panel">
    <h3>Doctor Schedule</h3>
    <form class="form form--inline" @submit.prevent>
      <input v-model="doctorIdLocal" placeholder="Doctor ID" @input="emitChange" />
    </form>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Patient</th>
          <th>Start</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="appt in schedule" :key="appt.id">
          <td>{{ appt.id }}</td>
          <td>{{ appt.patientId }}</td>
          <td>{{ formatDate(appt.startAt) }}</td>
          <td>{{ appt.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ schedule: { type: Array, default: () => [] }, doctorId: String });
const emit = defineEmits(['update:doctorId', 'change']);
const doctorIdLocal = ref(props.doctorId ?? '');
const emitChange = () => { emit('update:doctorId', doctorIdLocal.value); emit('change', doctorIdLocal.value); };
watch(() => props.doctorId, (v) => { if (v !== doctorIdLocal.value) doctorIdLocal.value = v ?? ''; });
const formatDate = (value) => new Date(value).toLocaleString();
</script>
