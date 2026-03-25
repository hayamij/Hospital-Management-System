<template>
  <div class="card-detail-page">
    <p class="back-link-wrap"><RouterLink class="back-link" to="/public">← Quay về cổng thông tin công khai</RouterLink></p>

    <header class="panel hero">
      <p class="eyebrow">CHI TIẾT CÔNG KHAI</p>
      <h1>{{ pageTitle }}</h1>
      <p class="subtitle">{{ pageSubtitle }}</p>
      <div class="hero-actions">
        <RouterLink class="hero-btn" to="/">Trang chủ</RouterLink>
        <RouterLink class="hero-btn" to="/services">Xem dịch vụ</RouterLink>
      </div>
    </header>

    <section class="panel">
      <p v-if="loading" class="status">Đang tải chi tiết...</p>
      <template v-else-if="item">
        <template v-if="category === 'insurance-plans'">
          <article class="detail-card">
            <h2>{{ item.planName }}</h2>
            <p><strong>Nhà cung cấp:</strong> {{ item.provider }}</p>
            <p>{{ item.coverageSummary }}</p>
            <p><strong>Đồng chi trả:</strong> {{ item.copayAmount }}</p>
          </article>
        </template>

        <template v-else-if="category === 'booking-constraints'">
          <article class="detail-card">
            <h2>{{ item.title || item.code }}</h2>
            <p><strong>Mã:</strong> {{ item.code }}</p>
            <p>{{ item.description }}</p>
            <p><strong>Áp dụng cho:</strong> {{ item.appliesToRole }}</p>
            <p><strong>Giá trị:</strong> {{ item.value }}</p>
          </article>
        </template>

        <template v-else-if="category === 'doctors'">
          <article class="detail-card doctor">
            <h2>{{ item.fullName }}</h2>
            <p><strong>Chuyên môn:</strong> {{ item.specialization }}</p>
            <p><strong>Khoa:</strong> {{ item.department || '-' }}</p>
            <p><strong>Khung giờ/ngày:</strong> {{ item.availableSlotsPerDay }}</p>
            <p><strong>Trạng thái:</strong> {{ item.status }}</p>
            <div class="doctor-actions">
              <RouterLink class="cta primary" :to="`/patient/booking?doctor=${encodeURIComponent(item.id || itemId)}`">Đặt lịch khám</RouterLink>
              <RouterLink class="cta" to="/doctors">Xem tất cả bác sĩ</RouterLink>
            </div>
          </article>
        </template>

        <template v-else>
          <article class="detail-card">
            <h2>{{ item.name || item.id }}</h2>
            <p>{{ item.description || 'Không có thông tin bổ sung.' }}</p>
          </article>
        </template>
      </template>
      <p v-else class="status">Không tìm thấy dữ liệu.</p>
    </section>

    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const item = ref(null);

const category = computed(() => String(route.params.category || ''));
const itemId = computed(() => String(route.params.itemId || ''));

const titleMap = {
  'insurance-plans': 'Chi tiết gói bảo hiểm',
  'booking-constraints': 'Chi tiết ràng buộc đặt lịch',
  doctors: 'Chi tiết bác sĩ',
  services: 'Chi tiết dịch vụ',
};

const pageTitle = computed(() => titleMap[category.value] || 'Chi tiết');
const pageSubtitle = computed(() => `Danh mục: ${category.value || '-'} | Mã: ${itemId.value || '-'}`);

const load = async () => {
  loading.value = true;
  error.value = '';
  item.value = null;
  try {
    const response = await guestApi.cardDetail(category.value, itemId.value);
    item.value = response?.item ?? null;
  } catch (e) {
    error.value = e.message || 'Không thể tải chi tiết.';
  } finally {
    loading.value = false;
  }
};

watch(() => [category.value, itemId.value], load, { immediate: true });
</script>

<style scoped>
.card-detail-page {
  display: grid;
  gap: 20px;
}

.back-link-wrap {
  margin: 0;
}

.back-link {
  text-decoration: none;
  color: #1e293b;
  border-bottom: 1px solid #94a3b8;
}

.hero {
  background: linear-gradient(120deg, #f8fafc 0%, #eef2ff 100%);
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
}

.hero h1 {
  margin: 8px 0 0;
}

.subtitle {
  margin: 10px 0 0;
  color: #334155;
}

.hero-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-btn {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.detail-card {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  padding: 16px;
}

.detail-card h2 {
  margin: 0 0 10px;
}

.detail-card p {
  margin: 0 0 8px;
  color: #334155;
}

.doctor-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.cta {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: #0f172a;
}

.cta.primary {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.status {
  margin: 0;
}
</style>