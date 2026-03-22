<template>
  <div class="panel">
    <h3>Patients List</h3>
    <ul class="list">
      <li v-for="p in patients" :key="p.id">
        <strong>{{ p.name }}</strong> ({{ p.id }}) — age {{ p.profile?.age || 'n/a' }}, phone {{ p.profile?.phone || 'n/a' }}
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({ patients: { type: Array, default: () => [] } });
</script>
