<template>
  <div class="doctor-dashboard page">
    <header class="panel doctor-header">
      <div class="header-copy">
        <p class="eyebrow">DOCTOR WORKSPACE</p>
        <h1>Lịch khám hôm nay</h1>
        <p>Theo dõi bệnh nhân theo dòng thời gian, cập nhật trạng thái và truy cập nhanh vào ca khám.</p>
      </div>

      <div class="header-actions">
        <label class="status-field">
          <span>Trạng thái</span>
          <select v-model="statusFilter">
            <option value="all">Tất cả</option>
            <option value="waiting">Đang chờ</option>
            <option value="in-progress">Đang khám</option>
            <option value="completed">Đã khám</option>
            <option value="cancelled">Đã hủy</option>
            <option value="no-show">Vắng mặt</option>
          </select>
        </label>
        <button type="button" @click="refresh" :disabled="appointments.loading">Làm mới dữ liệu</button>
      </div>
    </header>

    <section class="kpi-grid">
      <article class="panel kpi-card primary">
        <p class="kpi-label">Tổng ca trong ngày</p>
        <p class="kpi-value">{{ totalToday }}</p>
        <p class="kpi-note">Lịch khám có thời gian bắt đầu trong hôm nay.</p>
      </article>

      <article class="panel kpi-card waiting">
        <p class="kpi-label">Đang chờ khám</p>
        <p class="kpi-value">{{ waitingCount }}</p>
        <p class="kpi-note">Các lịch hẹn cần xử lý trong phiên làm việc hiện tại.</p>
      </article>

      <article class="panel kpi-card done">
        <p class="kpi-label">Đã hoàn tất</p>
        <p class="kpi-value">{{ completedCount }}</p>
        <p class="kpi-note">Số ca đã hoàn tất trong hôm nay theo hệ thống.</p>
      </article>
    </section>

    <section class="panel timeline-panel">
      <div class="timeline-head">
        <h2>Lịch theo timeline hôm nay</h2>
        <small>{{ filteredTodayItems.length }} ca theo bộ lọc hiện tại</small>
      </div>

      <p v-if="appointments.loading" class="muted">Đang tải lịch làm việc...</p>
      <p v-else-if="appointments.error" class="msg err">{{ appointments.error }}</p>
      <p v-else-if="filteredTodayItems.length === 0" class="muted">Không có bệnh nhân phù hợp bộ lọc.</p>

      <div v-else class="timeline">
        <article v-for="item in filteredTodayItems" :key="item.id" class="timeline-item" :class="item.visualStatus">
          <div class="dot"></div>
          <div class="content">
            <p class="time">{{ item.timeRange }}</p>
            <h3>{{ item.patientName }}</h3>
            <p><strong>Lý do:</strong> {{ item.reason }}</p>
            <p><strong>Trạng thái:</strong> {{ item.statusLabel }}</p>
            <RouterLink
              v-if="item.patientId"
              class="consult-link"
              :to="`/doctor/consultation/${encodeURIComponent(item.patientId)}`"
            >
              Vào ca khám
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAppointmentsStore } from '../../stores/appointments.js';

const appointments = useAppointmentsStore();
const statusFilter = ref('all');
const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;
let dashboardRefreshTimer = null;

const waitingStatuses = new Set(['pending', 'scheduled', 'rescheduled', 'requested', 'confirmed']);
const inProgressStatuses = new Set(['in_progress']);
const completedStatuses = new Set(['completed', 'done']);
const cancelledStatuses = new Set(['cancelled', 'canceled', 'rejected']);
const noShowStatuses = new Set(['no_show']);

const resolveVisualStatus = (status) => {
  if (waitingStatuses.has(status)) return 'waiting';
  if (inProgressStatuses.has(status)) return 'in-progress';
  if (completedStatuses.has(status)) return 'completed';
  if (cancelledStatuses.has(status)) return 'cancelled';
  if (noShowStatuses.has(status)) return 'no-show';
  return 'other';
};

const resolveStatusLabel = (status) => {
  if (waitingStatuses.has(status)) return 'Đang chờ';
  if (inProgressStatuses.has(status)) return 'Đang khám';
  if (completedStatuses.has(status)) return 'Đã khám';
  if (cancelledStatuses.has(status)) return 'Đã hủy';
  if (noShowStatuses.has(status)) return 'Vắng mặt';
  return 'Khác';
};

const toDate = (value) => {
  const d = new Date(value || '');
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatTime = (value) => {
  const d = toDate(value);
  if (!d) return '--:--';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const normalizedItems = computed(() => {
  return appointments.items
    .map((raw, index) => {
      const start = raw.startAt || raw.appointmentDate || raw.scheduledAt || raw.date || '';
      const end = raw.endAt || raw.end || raw.slotEnd || '';
      const status = String(raw.status || 'pending').toLowerCase();
      const patientName = raw.patientName || raw.patientFullName || raw.patientId || `Patient ${index + 1}`;

      const visualStatus = resolveVisualStatus(status);
      const statusLabel = resolveStatusLabel(status);

      return {
        id: raw.id || raw.appointmentId || `appointment-${index + 1}`,
        start,
        end,
        startDate: toDate(start),
        patientId: raw.patientId || raw.patient?.id || '',
        patientName,
        reason: raw.reason || raw.serviceName || 'Kham tong quat',
        visualStatus,
        statusLabel,
        timeRange: `${formatTime(start)} - ${formatTime(end)}`,
      };
    })
    .sort((a, b) => {
      const ta = a.startDate ? a.startDate.getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.startDate ? b.startDate.getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
});

const todayItems = computed(() => {
  const now = new Date();
  return normalizedItems.value.filter((item) => isSameDay(item.startDate, now));
});

const filteredTodayItems = computed(() => {
  if (statusFilter.value === 'all') return todayItems.value;
  return todayItems.value.filter((item) => item.visualStatus === statusFilter.value);
});

const totalToday = computed(() => todayItems.value.length);
const waitingCount = computed(() => todayItems.value.filter((item) => item.visualStatus === 'waiting' || item.visualStatus === 'in-progress').length);
const completedCount = computed(() => todayItems.value.filter((item) => item.visualStatus === 'completed').length);

const refresh = async () => {
  if (appointments.loading) return;
  await appointments.fetchAppointments();
};

onMounted(() => {
  void refresh();
  dashboardRefreshTimer = setInterval(() => {
    void refresh();
  }, DASHBOARD_REFRESH_INTERVAL_MS);
});

onUnmounted(() => {
  if (dashboardRefreshTimer) {
    clearInterval(dashboardRefreshTimer);
    dashboardRefreshTimer = null;
  }
});
</script>

<style scoped>
.doctor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
  align-items: end;
  gap: 12px;
  flex-wrap: wrap;
}

.status-field {
  display: grid;
  gap: 8px;
  min-width: 220px;
}

.status-field span {
  color: #334155;
  font-weight: 600;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  display: grid;
  gap: 8px;
  align-content: start;
}

.kpi-card.primary {
  background: linear-gradient(120deg, #eff6ff 0%, #eef2ff 100%);
}

.kpi-card.waiting {
  background: linear-gradient(120deg, #fffbeb 0%, #fff7ed 100%);
}

.kpi-card.done {
  background: linear-gradient(120deg, #ecfeff 0%, #f0fdf4 100%);
}

.kpi-label {
  margin: 0;
  color: #475569;
}

.kpi-value {
  margin: 0;
  font-size: 36px;
  line-height: 1.1;
  font-weight: 700;
  color: #0f172a;
}

.kpi-note {
  margin: 0;
  color: #334155;
}

.timeline-panel {
  display: grid;
  gap: 14px;
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.timeline-head h2 {
  margin: 0;
}

.timeline-head small {
  color: #64748b;
}

.timeline {
  border-left: 2px solid #dbe2ea;
  padding-left: 18px;
  display: grid;
  gap: 12px;
}

.timeline-item {
  position: relative;
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  border-radius: 12px;
  padding: 14px;
}

.timeline-item .dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  left: -24px;
  top: 16px;
  background: #94a3b8;
}

.timeline-item.waiting .dot {
  background: #f59e0b;
}

.timeline-item.in-progress .dot {
  background: #0ea5e9;
}

.timeline-item.completed .dot {
  background: #16a34a;
}

.timeline-item.cancelled .dot {
  background: #dc2626;
}

.timeline-item.no-show .dot {
  background: #7c3aed;
}

.content h3 {
  margin: 6px 0;
}

.content p {
  margin: 0 0 6px;
  color: #334155;
}

.time {
  margin: 0;
  color: #1e3a8a;
  font-weight: 600;
}

.muted {
  margin: 0;
  color: #64748b;
}

.consult-link {
  margin-top: 10px;
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border: 1px solid #1d4ed8;
  background: #dbeafe;
  color: #1e3a8a;
  text-decoration: none;
}

@media (max-width: 1100px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>

