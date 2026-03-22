<template>
  <div class="panel">
    <h3>Schedule Appointment (Patient)</h3>
    <form class="form" @submit.prevent="emit('submit', localForm)">
      <input v-model="localForm.patientId" placeholder="Patient ID" required />
      <input v-model="localForm.doctorId" placeholder="Doctor ID" required />
      <label>Start <input type="datetime-local" v-model="localForm.startAt" required /></label>
      <label>End <input type="datetime-local" v-model="localForm.endAt" required /></label>
      <input v-model="localForm.reason" placeholder="Reason" />
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Schedule' }}</button>
    </form>
    <p v-if="lastScheduled">Created: {{ lastScheduled.appointmentId }} ({{ lastScheduled.status }})</p>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ patientId: '', doctorId: '', startAt: '', endAt: '', reason: '' }),
  },
  loading: Boolean,
  lastScheduled: Object,
});
const emit = defineEmits(['update:modelValue', 'submit']);

const localForm = reactive({ ...props.modelValue });

watch(
  () => ({ ...props.modelValue }),
  (val) => Object.assign(localForm, val)
);
watch(
  localForm,
  (val) => emit('update:modelValue', { ...val }),
  { deep: true }
);
</script>
