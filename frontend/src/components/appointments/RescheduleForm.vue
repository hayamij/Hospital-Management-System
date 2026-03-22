<template>
  <div class="panel">
    <h3>Reschedule</h3>
    <form class="form" @submit.prevent="emit('submit', { ...localForm })">
      <input v-model="localForm.id" placeholder="Appointment ID" required />
      <label>Start <input type="datetime-local" v-model="localForm.startAt" required /></label>
      <label>End <input type="datetime-local" v-model="localForm.endAt" required /></label>
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Reschedule' }}</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ id: '', startAt: '', endAt: '' }),
  },
  loading: Boolean,
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
