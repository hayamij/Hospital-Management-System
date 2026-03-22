<template>
  <label class="field">
    <span class="field__label" v-if="label">{{ label }}</span>
    <slot />
    <small v-if="hint" class="field__hint">{{ hint }}</small>
    <small v-if="error" class="field__error">{{ error }}</small>
  </label>
</template>

<script setup>
const props = defineProps({
  label: String,
  hint: String,
  error: String,
});
</script>

<style scoped>
.field { display: grid; gap: 0.25rem; }
.field__label { font-size: 0.9rem; color: #475569; }
.field__hint { color: #94a3b8; }
.field__error { color: #dc2626; }
</style>
