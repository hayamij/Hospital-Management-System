<template>
  <div class="panel">
    <h3>Update Profile</h3>
    <form class="form" @submit.prevent="emit('submit', { ...form })">
      <input v-model="form.id" placeholder="Patient ID" required />
      <input v-model="form.phone" placeholder="Phone" />
      <input v-model.number="form.age" type="number" placeholder="Age" />
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Update' }}</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ id: '', phone: '', age: '' }) }, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit']);
const form = reactive({ ...props.modelValue });
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
</script>
