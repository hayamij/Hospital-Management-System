<template>
  <div class="admin-dashboard page">
    <header class="panel dashboard-header">
      <div class="header-copy">
        <p class="eyebrow">ADMIN CONSOLE</p>
        <h1>Bảng điều khiển quản trị</h1>
        <p>Theo dõi vận hành bệnh viện và truy cập nhanh các khu vực quản trị trọng yếu.</p>
      </div>

      <div class="header-actions">
        <RouterLink to="/admin/ops" class="action-link">Điều phối vận hành</RouterLink>
        <button type="button" @click="loadOverview" :disabled="loading">Cập nhật số liệu</button>
      </div>
    </header>

    <section class="top-grid">
      <article class="panel hero-card">
        <div class="hero-head">
          <div>
            <p class="hero-label">Tổng doanh thu ngày</p>
            <p class="hero-value">{{ formatCurrency(dailyRevenue) }}</p>
          </div>
          <p class="hero-date">{{ currentDateLabel }}</p>
        </div>

        <div class="hero-meta">
          <p>
            <span>Số ca khám</span>
            <strong>{{ formatInteger(totalCases) }}</strong>
          </p>
          <p>
            <span>Bệnh nhân đang theo dõi</span>
            <strong>{{ formatInteger(totalPatients) }}</strong>
          </p>
          <p>
            <span>Trạng thái hệ thống</span>
            <strong>Ổn định</strong>
          </p>
        </div>

        <div class="sparkline" aria-hidden="true">
          <span
            v-for="(point, index) in sparkSeries"
            :key="`spark-${index}`"
            class="spark-bar"
            :style="{ height: `${point}%` }"
          ></span>
        </div>
      </article>

      <article class="panel side-kpi">
        <p class="kpi-label">Bệnh nhân</p>
        <p class="kpi-value">{{ formatInteger(totalPatients) }}</p>
        <p class="kpi-foot">Đang hoạt động trong hệ thống hồ sơ.</p>
      </article>

      <article class="panel side-kpi accent">
        <p class="kpi-label">Số ca khám</p>
        <p class="kpi-value">{{ formatInteger(totalCases) }}</p>
        <p class="kpi-foot">Đã ghi nhận trong chu kỳ báo cáo hiện tại.</p>
      </article>
    </section>

    <section class="panel workspace-panel">
      <div class="workspace-head">
        <h2>Khu vực quản trị nhanh</h2>
        <p>Điều hướng trực tiếp tới các module thường xuyên sử dụng.</p>
      </div>

      <div class="module-grid">
        <RouterLink class="module-card" to="/admin/patients">
          <h3>Quản lý bệnh nhân</h3>
          <p>Tra cứu, cập nhật hồ sơ và thông tin chăm sóc.</p>
        </RouterLink>

        <RouterLink class="module-card" to="/admin/appointments">
          <h3>Lịch trình khám</h3>
          <p>Điều chỉnh ca khám và theo dõi trạng thái lịch hẹn.</p>
        </RouterLink>

        <RouterLink class="module-card" to="/admin/billing">
          <h3>Tài chính - hóa đơn</h3>
          <p>Kiểm soát dòng tiền, hóa đơn và công nợ theo thời gian thực.</p>
        </RouterLink>

        <RouterLink class="module-card" to="/admin/ops">
          <h3>Điều phối vận hành</h3>
          <p>Thiết lập dịch vụ, nhân sự và tham số vận hành hệ thống.</p>
        </RouterLink>
      </div>
    </section>

    <section class="panel summary-panel">
      <header class="summary-head">
        <h2>Snapshot vận hành</h2>
        <small>Đồng bộ theo dữ liệu báo cáo mới nhất</small>
      </header>

      <div class="summary-table">
        <div class="summary-row header">
          <span>Chỉ số</span>
          <span>Giá trị</span>
          <span>Ghi chú</span>
        </div>

        <div class="summary-row" v-for="item in summaryRows" :key="item.label">
          <strong>{{ item.label }}</strong>
          <span>{{ item.value }}</span>
          <span>{{ item.note }}</span>
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

const formatInteger = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN') + ' VND';

const currentDateLabel = computed(() => {
  return new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
});

const sparkSeries = computed(() => {
  const source = [
    totalPatients.value,
    totalCases.value,
    Math.round(dailyRevenue.value / 100000),
    totalCases.value + totalPatients.value,
  ];

  return Array.from({ length: 16 }, (_v, index) => {
    const base = source[index % source.length] || 1;
    const value = ((base * (index + 3)) % 88) + 12;
    return Math.max(12, Math.min(100, value));
  });
});

const summaryRows = computed(() => [
  {
    label: 'Tổng bệnh nhân',
    value: formatInteger(totalPatients.value),
    note: 'Quản lý bởi module hồ sơ và bệnh nhân.',
  },
  {
    label: 'Số ca khám',
    value: formatInteger(totalCases.value),
    note: 'Tổng hợp từ lịch hẹn đã phát sinh.',
  },
  {
    label: 'Doanh thu ngày',
    value: formatCurrency(dailyRevenue.value),
    note: 'Dữ liệu từ module tài chính và hóa đơn.',
  },
]);

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
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
}

.header-copy h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.header-copy p {
  margin: 10px 0 0;
  color: #334155;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-link {
  min-height: 44px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #111827;
  text-decoration: none;
}

.top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(260px, 1fr) minmax(260px, 1fr);
  gap: 14px;
}

.hero-card {
  display: grid;
  gap: 14px;
  background: linear-gradient(120deg, #f8fafc 0%, #eef2ff 100%);
}

.hero-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-label,
.kpi-label {
  margin: 0;
  color: #475569;
}

.hero-value {
  margin: 8px 0 0;
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}

.hero-date {
  margin: 0;
  color: #334155;
  font-size: 14px;
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hero-meta p {
  margin: 0;
  border: 1px solid #dbeafe;
  background: #ffffff;
  padding: 10px;
  display: grid;
  gap: 6px;
}

.hero-meta span {
  color: #64748b;
  font-size: 13px;
}

.hero-meta strong {
  color: #0f172a;
}

.sparkline {
  height: 110px;
  display: grid;
  grid-template-columns: repeat(16, minmax(0, 1fr));
  gap: 7px;
  align-items: end;
}

.spark-bar {
  background: #2563eb;
  border-radius: 3px 3px 0 0;
}

.side-kpi {
  background: #ffffff;
  display: grid;
  align-content: start;
  gap: 10px;
}

.side-kpi.accent {
  background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.kpi-value {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
}

.kpi-foot {
  margin: 0;
  color: #334155;
}

.workspace-panel,
.summary-panel {
  background: #ffffff;
}

.workspace-head h2,
.summary-head h2 {
  margin: 0;
}

.workspace-head p {
  margin: 8px 0 0;
  color: #475569;
}

.module-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.module-card {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  padding: 14px;
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 8px;
}

.module-card h3,
.module-card p {
  margin: 0;
}

.module-card p {
  color: #334155;
}

.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.summary-head small {
  color: #64748b;
}

.summary-table {
  margin-top: 12px;
  display: grid;
  border: 1px solid #e2e8f0;
}

.summary-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(160px, 1fr) minmax(220px, 1.3fr);
  gap: 14px;
  padding: 11px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.summary-row.header {
  background: #f8fafc;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row strong,
.summary-row span {
  min-width: 0;
}

@media (max-width: 1300px) {
  .top-grid {
    grid-template-columns: 1fr;
  }

  .module-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

@media (max-width: 900px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .hero-value,
  .kpi-value {
    font-size: 28px;
  }

  .hero-meta {
    grid-template-columns: 1fr;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
