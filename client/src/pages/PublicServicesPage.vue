<template>
  <PublicServicesPanel
    v-model:search-text="searchText"
    v-model:category-filter="categoryFilter"
    :loading="loading"
    :error="error"
    :category-options="categoryOptions"
    :filtered-services="filteredServices"
    :featured-services="featuredServices"
    :format-price="formatPrice"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { guestApi } from '../services/api.js';
import PublicServicesPanel from '../components/public/PublicServicesPanel.vue';
import { formatPrice, loadCatalogServices } from '../domains/public/services/catalog.js';

const services = ref([]);
const loading = ref(false);
const error = ref('');
const searchText = ref('');
const categoryFilter = ref('all');

const categoryOptions = computed(() => {
  const groups = new Set(services.value.map((item) => item.category).filter(Boolean));
  return Array.from(groups).sort((a, b) => a.localeCompare(b));
});

const filteredServices = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  return services.value.filter((item) => {
    const inCategory = categoryFilter.value === 'all' || item.category === categoryFilter.value;
    if (!inCategory) return false;
    if (!q) return true;
    const name = item.name.toLowerCase();
    const description = String(item.description || '').toLowerCase();
    const category = String(item.category || '').toLowerCase();
    return name.includes(q) || description.includes(q) || category.includes(q);
  });
});

const featuredServices = computed(() => filteredServices.value.slice(0, 3));

const loadServices = async () => {
  loading.value = true;
  error.value = '';

  try {
    services.value = await loadCatalogServices(guestApi);
  } catch (e) {
    error.value = e?.message || 'Không thể tải danh sách dịch vụ từ hệ thống.';
  } finally {
    loading.value = false;
  }
};

onMounted(loadServices);
</script>
