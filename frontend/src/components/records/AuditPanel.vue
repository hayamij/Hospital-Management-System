<template>
  <div class="panel">
    <h3>Audit Records (Admin)</h3>
    <form class="form form--inline" @submit.prevent="emit('submit', auditId)">
      <input v-model="auditId" placeholder="Record ID" />
      <button type="submit" :disabled="loading">{{ loading ? 'Working...' : 'Audit' }}</button>
    </form>
    <pre v-if="auditResult" class="audit">{{ auditResult }}</pre>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ modelValue: String, auditResult: String, loading: Boolean });
const emit = defineEmits(['update:modelValue', 'submit']);
const auditId = ref(props.modelValue ?? '');
watch(() => props.modelValue, (v) => { auditId.value = v ?? ''; });
watch(auditId, (v) => emit('update:modelValue', v));
</script>

<style scoped>
.audit { margin-top: 0.5rem; background: #0f172a; color: #e2e8f0; padding: 0.75rem; border-radius: 6px; white-space: pre-wrap; }
</style>
