<template>
  <div class="panel">
    <h3>Services & Pricing</h3>
    <ul class="list">
      <li v-for="svc in services" :key="svc.id">{{ svc.name }} — ${{ svc.price }}</li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({ services: { type: Array, default: () => [] } });
</script>
