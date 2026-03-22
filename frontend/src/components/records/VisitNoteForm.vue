<template>
  <div class="panel">
    <h3>Add Visit Note</h3>
    <form class="form" @submit.prevent="emit('submit', { ...form })">
      <input v-model="form.patientId" placeholder="Patient ID" required />
      <input v-model="form.recordId" placeholder="Record ID" />
      <textarea v-model="form.note" placeholder="Visit note" rows="3"></textarea>
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Add Note' }}</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ patientId: '', recordId: '', note: '' }) }, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit']);
const form = reactive({ ...props.modelValue });
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
</script>
