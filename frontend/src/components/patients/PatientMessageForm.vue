<template>
  <div class="panel">
    <h3>Send Message to Doctor</h3>
    <form class="form" @submit.prevent="emit('submit', { ...form })">
      <input v-model="form.patientId" placeholder="Patient ID" required />
      <input v-model="form.doctorId" placeholder="Doctor ID" required />
      <textarea v-model="form.text" placeholder="Message" rows="3"></textarea>
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Send' }}</button>
    </form>
    <p v-if="lastMessage">Sent message {{ lastMessage.id }}</p>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ patientId: '', doctorId: '', text: '' }) }, loading: Boolean, lastMessage: Object });
const emit = defineEmits(['update:modelValue', 'submit']);
const form = reactive({ ...props.modelValue });
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
</script>
