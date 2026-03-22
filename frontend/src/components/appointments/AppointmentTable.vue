<template>
  <div class="panel">
    <h3>Appointments</h3>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Patient</th>
          <th>Doctor</th>
          <th>Start</th>
          <th>End</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="appt in appointments" :key="appt.id">
          <td>{{ appt.id }}</td>
          <td>{{ appt.patientId }}</td>
          <td>{{ appt.doctorId }}</td>
          <td>{{ formatDate(appt.startAt) }}</td>
          <td>{{ formatDate(appt.endAt) }}</td>
          <td>{{ appt.status }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  appointments: {
    type: Array,
    default: () => [],
  },
});

const formatDate = (value) => new Date(value).toLocaleString();
</script>
