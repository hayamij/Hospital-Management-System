<template>
  <div class="panel">
    <h3>Issue / Update Invoice</h3>
    <form class="form" @submit.prevent="emit('submit', { ...form })">
      <input v-model="form.id" placeholder="Invoice ID (optional)" />
      <input v-model="form.patientId" placeholder="Patient ID" required />
      <input v-model.number="form.total" type="number" placeholder="Total" />
      <input v-model="form.dueDate" type="date" placeholder="Due Date" />
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Issue' }}</button>
    </form>
    <form class="form form--inline" @submit.prevent="emit('mark', markId)">
      <input v-model="markId" placeholder="Invoice ID" />
      <button type="submit" :disabled="loading">Mark Paid</button>
      <button type="button" class="danger" :disabled="loading" @click="emit('void', markId)">Void</button>
    </form>
    <p v-if="lastInvoice">Invoice {{ lastInvoice.invoiceId }} → {{ lastInvoice.status }}</p>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
const props = defineProps({ modelValue: { type: Object, default: () => ({ id: '', patientId: '', total: 0, dueDate: '' }) }, lastInvoice: Object, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit', 'mark', 'void']);
const form = reactive({ ...props.modelValue });
const markId = ref('');
watch(() => ({ ...props.modelValue }), (v) => Object.assign(form, v));
watch(form, (v) => emit('update:modelValue', { ...v }), { deep: true });
</script>
