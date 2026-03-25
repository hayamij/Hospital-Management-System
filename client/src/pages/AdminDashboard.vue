<template>
  <div class="admin-dashboard page">
    <header class="panel header-panel">
      <div>
        <h1>Bảng điều khiển quản trị</h1>
        <p>Bảng điều khiển tổng quan vận hành bệnh viện theo ngày.</p>
      </div>
      <button type="button" @click="loadOverview" :disabled="loading">Cập nhật số liệu</button>
    </header>

    <section class="stats-grid">
      <article class="kpi-card">
        <p class="kpi-label">Tổng bệnh nhân</p>
        <p class="kpi-value">{{ formatInteger(totalPatients) }}</p>
      </article>

      <article class="kpi-card">
        <p class="kpi-label">Doanh thu ngày</p>
        <p class="kpi-value">{{ formatCurrency(dailyRevenue) }}</p>
      </article>

      <article class="kpi-card">
        <p class="kpi-label">Số ca khám</p>
        <p class="kpi-value">{{ formatInteger(totalCases) }}</p>
      </article>
    </section>

    <section class="panel chart-panel">
      <h2>Biểu đồ tổng quan</h2>
      <div class="bar-chart">
        <div class="bar-col">
          <div class="bar" :style="{ height: chartHeights.patients + '%' }"></div>
          <p>Bệnh nhân</p>
        </div>
        <div class="bar-col">
          <div class="bar revenue" :style="{ height: chartHeights.revenue + '%' }"></div>
          <p>Doanh thu</p>
        </div>
        <div class="bar-col">
          <div class="bar cases" :style="{ height: chartHeights.cases + '%' }"></div>
          <p>Ca khám</p>
        </div>
      </div>
    </section>

    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { adminApi } from '../services/api.js';

const auth = useAuthStore();
const loading = ref(false);
const error = ref('');

const totalPatients = ref(0);
const dailyRevenue = ref(0);
const totalCases = ref(0);

const chartHeights = computed(() => {
  const values = [totalPatients.value, dailyRevenue.value, totalCases.value];
  const max = Math.max(...values, 1);

  const normalize = (val) => {
    if (!val || val <= 0) return 8;
    return Math.max(8, Math.round((val / max) * 100));
  };

  return {
    patients: normalize(totalPatients.value),
    revenue: normalize(dailyRevenue.value),
    cases: normalize(totalCases.value),
  };
});

const formatInteger = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN') + ' VND';

const loadOverview = async () => {
  loading.value = true;
  error.value = '';

  try {
    const report = await adminApi.runReport(auth.token, {
      reportName: 'daily_admin_overview',
    });

    totalPatients.value = report?.counts?.patients ?? 0;
    totalCases.value = report?.counts?.appointments ?? report?.counts?.cases ?? 0;
    dailyRevenue.value = report?.totals?.revenueDay ?? report?.totals?.revenue ?? 0;
  } catch (e) {
    error.value = e?.message || 'Không thể tải số liệu dashboard.';
  } finally {
    loading.value = false;
  }
};

onMounted(loadOverview);
</script>

<style scoped>
.header-panel {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.kpi-card {
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 18px;
}

.kpi-label {
  margin: 0;
  color: #475569;
}

.kpi-value {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}

.chart-panel h2 {
  margin: 0 0 14px;
}

.bar-chart {
  height: 280px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: end;
}

.bar-col {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.bar {
  width: min(92px, 100%);
  min-height: 16px;
  background: #2563eb;
}

.bar.revenue {
  background: #0f766e;
}

.bar.cases {
  background: #9333ea;
}

.bar-col p {
  margin: 0;
  color: #334155;
}
</style>
