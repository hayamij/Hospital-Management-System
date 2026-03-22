<template>
  <div class="panel">
    <h3>Update Profile & Availability</h3>
    <form class="form" @submit.prevent="emit('submit', buildPayload())">
      <input v-model="form.id" placeholder="Doctor ID" required />
      <input v-model="form.name" placeholder="Name" />
      <input v-model="form.specialty" placeholder="Specialty" />
      <textarea v-model="form.availability" placeholder="Availability (comma separated ISO dates)" rows="3"></textarea>
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Update' }}</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ id: '', name: '', specialty: '', availability: '' }) }, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit']);
const form = reactive({ ...props.modelValue });
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
const buildPayload = () => {
  const availability = form.availability ? form.availability.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  return {
    id: form.id,
    profile: { name: form.name || undefined, specialty: form.specialty || undefined, availability },
    slotsPerDay: availability?.length,
  };
};
</script>
