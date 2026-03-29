<template>
  <PublicServiceDetailPanel
    :loading="loading"
    :error="error"
    :service="service"
    :has-fetched="hasFetched"
    :booking-link="bookingLink"
    :related-services="relatedServices"
    :format-price="formatPrice"
    @retry="load"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';
import PublicServiceDetailPanel from '../components/public/PublicServiceDetailPanel.vue';
import {
  buildBookingLink,
  formatPrice,
  mapRelatedServices,
  normalizeService,
} from '../domains/public/services/detail.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const service = ref(null);
const allServices = ref([]);
const hasFetched = ref(false);
let currentRequestId = 0;

const bookingLink = computed(() => {
  return buildBookingLink(service.value?.id);
});

const relatedServices = computed(() => {
  if (!service.value?.id) return [];
  return allServices.value.filter((item) => item.id && item.id !== service.value.id).slice(0, 3);
});

const loadRelatedServices = async () => {
  try {
    const response = await guestApi.publicInfo();
    const list = Array.isArray(response?.services) ? response.services : [];
    allServices.value = mapRelatedServices(list);
  } catch {
    allServices.value = [];
  }
};

const load = async () => {
  const serviceId = String(route.params.serviceId || '').trim();
  const requestId = ++currentRequestId;

  hasFetched.value = false;
  loading.value = true;
  error.value = '';
  service.value = null;

  if (!serviceId) {
    loading.value = false;
    error.value = 'Mã dịch vụ không hợp lệ.';
    hasFetched.value = true;
    return;
  }

  try {
    const [response] = await Promise.all([
      guestApi.getServiceDetail(serviceId),
      loadRelatedServices(),
    ]);

    if (requestId !== currentRequestId) {
      return;
    }

    service.value = normalizeService(response);
  } catch (e) {
    if (requestId !== currentRequestId) {
      return;
    }

    error.value = e?.message || 'Không thể tải chi tiết dịch vụ.';
  } finally {
    if (requestId === currentRequestId) {
      loading.value = false;
      hasFetched.value = true;
    }
  }
};

watch(() => route.params.serviceId, load, { immediate: true });
</script>
