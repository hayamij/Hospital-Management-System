<template>
  <div class="panel">
    <h3>Register Patient</h3>
    <form class="form" @submit.prevent="emit('submit', { ...form })">
      <input v-model="form.name" placeholder="Name" required />
      <input v-model.number="form.age" type="number" placeholder="Age" />
      <input v-model="form.phone" placeholder="Phone" />
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Register' }}</button>
    </form>
    <p v-if="lastRegistered">New patient ID: {{ lastRegistered.patientId }}</p>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ name: '', age: '', phone: '' }) }, loading: Boolean, lastRegistered: Object });
const emit = defineEmits(['update:modelValue', 'submit']);
const form = reactive({ ...props.modelValue });
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
</script>
