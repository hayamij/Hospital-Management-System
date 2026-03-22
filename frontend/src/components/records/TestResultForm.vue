<template>
  <div class="panel">
    <h3>Review Test Result</h3>
    <form class="form" @submit.prevent="emit('submit', { ...form })">
      <input v-model="form.labResultId" placeholder="Lab Result ID" required />
      <input v-model="form.doctorId" placeholder="Doctor ID (optional)" />
      <textarea v-model="form.result" placeholder="Result / notes" rows="3"></textarea>
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Add Result' }}</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ labResultId: '', doctorId: '', result: '' }) }, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit']);
const form = reactive({ ...props.modelValue });
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
</script>
