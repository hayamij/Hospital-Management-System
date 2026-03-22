<template>
  <div class="panel">
    <h3>View Records</h3>
    <form class="form form--inline" @submit.prevent>
      <input v-model="patientIdLocal" placeholder="Patient ID" @input="emitChange" />
    </form>
    <ul class="list">
      <li v-for="record in records" :key="record.id">
        <div><strong>ID:</strong> {{ record.id }}</div>
        <div><strong>Entries:</strong> {{ (record.entries || []).join('; ') }}</div>
        <div><strong>Tests:</strong> {{ (record.tests || []).join('; ') }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ records: { type: Array, default: () => [] }, patientId: String });
const emit = defineEmits(['update:patientId', 'change']);
const patientIdLocal = ref(props.patientId ?? '');
const emitChange = () => { emit('update:patientId', patientIdLocal.value); emit('change', patientIdLocal.value); };
watch(() => props.patientId, (v) => { if (v !== patientIdLocal.value) patientIdLocal.value = v ?? ''; });
</script>
