<template>
  <div class="page">
    <header class="panel">
      <h1>Service Detail</h1>
      <p>Click-through page for home services.</p>
      <div class="row">
        <RouterLink to="/">Back to home</RouterLink>
        <RouterLink to="/appointments">Book appointment</RouterLink>
      </div>
    </header>

    <section class="panel">
      <p v-if="loading">Loading service detail...</p>
      <template v-else-if="service">
        <h2>{{ service.name }}</h2>
        <p>{{ service.description || 'Service details are available at the clinic desk.' }}</p>
        <p><strong>Price:</strong> {{ service.price }}</p>
      </template>
      <p v-else>Service not found.</p>
    </section>

    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const service = ref(null);

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await guestApi.serviceDetail(route.params.serviceId);
    service.value = response?.service ?? null;
  } catch (e) {
    error.value = e.message || 'Failed to load service detail.';
  } finally {
    loading.value = false;
  }
};

watch(() => route.params.serviceId, load, { immediate: true });
</script>

<style scoped>
.row a {
  color: #111827;
  text-decoration: none;
}
</style>
