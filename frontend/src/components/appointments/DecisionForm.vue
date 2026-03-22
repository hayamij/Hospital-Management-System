<template>
  <div class="panel">
    <h3>Doctor Decision</h3>
    <form class="form" @submit.prevent="emit('submit', { ...localForm })">
      <input v-model="localForm.id" placeholder="Appointment ID" required />
      <select v-model="localForm.decision">
        <option value="approved">Approve</option>
        <option value="rejected">Reject</option>
      </select>
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Apply' }}</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ id: '', decision: 'approved' }),
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
