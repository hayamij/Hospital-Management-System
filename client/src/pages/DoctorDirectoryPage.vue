<template>
  <PublicDoctorDirectoryPanel
    :loading="loading"
    :error="error"
    :query="filters.query"
    :specialty="filters.specialty"
    :specialty-options="specialtyOptions"
    :display-doctors="displayDoctors"
    @submit="searchDoctors"
    @reset="resetFilters"
    @update:query="(value) => (filters.query = value)"
    @update:specialty="(value) => (filters.specialty = value)"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';
import PublicDoctorDirectoryPanel from '../components/public/PublicDoctorDirectoryPanel.vue';
import {
  filterDoctors,
  listSpecialties,
  loadDoctorDirectory,
} from '../domains/public/services/doctors.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const doctors = ref([]);

const filters = reactive({
  query: '',
  specialty: '',
});

const specialtyOptions = computed(() => {
  return listSpecialties(doctors.value);
});

const displayDoctors = computed(() => {
  return filterDoctors({
    doctors: doctors.value,
    query: filters.query,
    specialty: filters.specialty,
  });
});

const searchDoctors = async () => {
  loading.value = true;
  error.value = '';

  try {
    doctors.value = await loadDoctorDirectory(guestApi, {
      query: filters.query,
      specialty: filters.specialty,
    });
  } catch (e) {
    error.value = e?.message || 'Không thể tải danh sách bác sĩ từ hệ thống.';
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.query = '';
  filters.specialty = '';
};

onMounted(() => {
  const initialSpecialty = String(route.query.specialty || '').trim();
  if (initialSpecialty) {
    filters.specialty = initialSpecialty;
  }
  searchDoctors();
});
</script>
