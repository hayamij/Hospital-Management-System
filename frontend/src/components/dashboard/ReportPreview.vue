<template>
  <div class="panel">
    <h3>Latest Report</h3>
    <p v-if="loading">Generating...</p>
    <p v-else-if="!report">No report yet. Run a report to populate metrics.</p>
    <div v-else class="grid">
      <div>
        <p class="label">ID</p>
        <p class="value">{{ report.id ?? report.reportId ?? 'n/a' }}</p>
      </div>
      <div>
        <p class="label">Created</p>
        <p class="value">{{ formatDate(report.createdAt ?? report.generatedAt) }}</p>
      </div>
      <div>
        <p class="label">Appointments</p>
        <p class="value">{{ report.appointments ?? report.counts?.appointments ?? '—' }}</p>
      </div>
      <div>
        <p class="label">Revenue</p>
        <p class="value">${{ report.revenue ?? report.totals?.revenue ?? report.counts?.revenue ?? '—' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ report: Object, loading: Boolean });
const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'n/a');
</script>

<style scoped>
.panel { padding: 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; }
.label { margin: 0; color: #475569; font-weight: 600; }
.value { margin: 0.1rem 0 0; font-size: 1.1rem; font-weight: 700; }
</style>
