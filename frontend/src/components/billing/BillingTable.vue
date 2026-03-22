<template>
  <div class="panel">
    <h3>Billing</h3>
    <form class="form form--inline" @submit.prevent>
      <input v-model="patientIdLocal" placeholder="Patient ID" @input="emitChange" />
    </form>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Due</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="bill in billing" :key="bill.id">
          <td>{{ bill.id }}</td>
          <td>{{ bill.status }}</td>
          <td>{{ bill.dueDate ? formatDate(bill.dueDate) : 'n/a' }}</td>
          <td>${{ bill.total }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ billing: { type: Array, default: () => [] }, patientId: String });
const emit = defineEmits(['update:patientId', 'change']);
const patientIdLocal = ref(props.patientId ?? '');
const emitChange = () => { emit('update:patientId', patientIdLocal.value); emit('change', patientIdLocal.value); };
watch(() => props.patientId, (v) => { if (v !== patientIdLocal.value) patientIdLocal.value = v ?? ''; });
const formatDate = (value) => new Date(value).toLocaleDateString();
</script>
