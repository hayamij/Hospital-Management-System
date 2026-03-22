<template>
  <div v-if="message" :class="['alert', type]">
    <slot>{{ message }}</slot>
  </div>
</template>

<script setup>
const props = defineProps({
  message: String,
  type: { type: String, default: 'info' },
});
</script>

<style scoped>
.alert { padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; color: #0f172a; }
.alert.info { border-color: #3b82f6; background: #eff6ff; }
.alert.error { border-color: #ef4444; background: #fef2f2; color: #991b1b; }
.alert.success { border-color: #10b981; background: #ecfdf3; color: #065f46; }
</style>
