<template>
  <div class="panel">
    <h3>Cancel</h3>
    <form class="form" @submit.prevent="emit('submit', cancelId)">
      <input v-model="cancelId" placeholder="Appointment ID" required />
      <button type="submit" class="danger" :disabled="loading">{{ loading ? 'Working...' : 'Cancel Appointment' }}</button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  loading: Boolean,
});
const emit = defineEmits(['update:modelValue', 'submit']);

const cancelId = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    cancelId.value = val;
  }
);
watch(cancelId, (val) => emit('update:modelValue', val));
</script>
