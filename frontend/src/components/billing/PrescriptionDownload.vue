<template>
  <div class="panel">
    <h3>Download Prescription</h3>
    <form class="form form--inline" @submit.prevent="emit('submit', prescriptionId)">
      <input v-model="prescriptionId" placeholder="Prescription ID" />
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Get Link' }}</button>
    </form>
    <p v-if="link">Link: {{ link.url }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ modelValue: String, link: Object, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit']);
const prescriptionId = ref(props.modelValue ?? '');
watch(() => props.modelValue, (v) => { prescriptionId.value = v ?? ''; });
watch(prescriptionId, (v) => emit('update:modelValue', v));
</script>
