<template>
  <div class="grid">
    <div v-for="card in cards" :key="card.key" class="card">
      <p class="label">{{ card.label }}</p>
      <p class="value">{{ loading ? '...' : card.value }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ stats: { type: Object, default: () => ({}) }, loading: Boolean });

const cards = computed(() => ([
  { key: 'patients', label: 'Patients', value: props.stats?.patients ?? 0 },
  { key: 'doctors', label: 'Doctors', value: props.stats?.doctors ?? 0 },
  { key: 'appointments', label: 'Appointments', value: props.stats?.appointments ?? 0 },
  { key: 'revenue', label: 'Billing Total', value: props.stats?.revenue ?? 0 },
]));
</script>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
.card { padding: 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
.label { margin: 0; color: #475569; font-weight: 600; }
.value { margin: 0.2rem 0 0; font-size: 1.6rem; font-weight: 700; }
</style>
