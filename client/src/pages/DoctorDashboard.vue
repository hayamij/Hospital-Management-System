<template>
  <div class="doctor-dashboard page">
    <header class="panel">
      <div class="head-row">
        <div>
            <h1>Lịch khám hôm nay</h1>
            <p>Danh sách bệnh nhân chờ khám trong ngày của bác sĩ.</p>
        </div>
          <button type="button" @click="refresh" :disabled="appointments.loading">Làm mới</button>
      </div>

      <div class="filters">
        <label>
          <span>Trang thai</span>
          <select v-model="statusFilter">
            <option value="all">Tất cả</option>
            <option value="waiting">Đang chờ</option>
            <option value="completed">Đã khám</option>
          </select>
        </label>
      </div>
    </header>

    <section class="panel">
      <h2>Lịch theo timeline hôm nay</h2>

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
import { computed, onMounted, ref } from 'vue';
import { useAppointmentsStore } from '../stores/appointments.js';
import { useAuthStore } from '../stores/auth.js';

const appointments = useAppointmentsStore();
const auth = useAuthStore();
const statusFilter = ref('all');

const waitingStatuses = new Set(['pending', 'scheduled', 'rescheduled', 'in_progress']);

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

      const visualStatus = waitingStatuses.has(status) ? 'waiting' : status === 'completed' ? 'completed' : 'waiting';
      const statusLabel = visualStatus === 'completed' ? 'Đã khám' : 'Đang chờ';

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

const refresh = () => appointments.fetchAppointments({ doctorId: auth.userId });

onMounted(refresh);
</script>

<style scoped>
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
}

.head-row h1 {
  margin-bottom: 8px;
}

.filters {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(220px, 280px);
}

.filters label {
  display: grid;
  gap: 8px;
}

.filters span {
  color: #334155;
  font-weight: 600;
}

.timeline {
  margin-top: 12px;
  border-left: 2px solid #cbd5e1;
  padding-left: 16px;
  display: grid;
  gap: 12px;
}

.timeline-item {
  position: relative;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 12px;
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

.timeline-item.completed .dot {
  background: #16a34a;
}

.content h3 {
  margin: 6px 0;
}

.content p {
  margin: 0 0 4px;
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
  margin-top: 8px;
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid #1d4ed8;
  background: #dbeafe;
  color: #1e3a8a;
  text-decoration: none;
}
</style>
