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
        <article v-for="item in pagedTodayItems" :key="item.id" class="timeline-item" :class="item.visualStatus">
          <div class="dot"></div>
          <div class="content">
            <p class="time">{{ item.timeRange }}</p>
            <h3>{{ item.patientName }}</h3>
            <p><strong>Lý do:</strong> {{ item.reason }}</p>
            <p><strong>Trạng thái:</strong> {{ item.statusLabel }}</p>

            <div class="row consult-actions">
              <RouterLink
                v-if="canEnterConsultation(item)"
                class="consult-link"
                :to="`/doctor/consultation/${encodeURIComponent(item.patientId)}`"
              >
                Vào ca khám
              </RouterLink>

              <button
                v-if="canDecide(item)"
                type="button"
                :disabled="isAppointmentActionBusy(item.id)"
                @click="decideAppointment(item, 'accept')"
              >
                Chấp nhận lịch
              </button>
              <button
                v-if="canDecide(item)"
                type="button"
                class="reject-btn"
                :disabled="isAppointmentActionBusy(item.id)"
                @click="decideAppointment(item, 'reject')"
              >
                Từ chối
              </button>

              <button
                v-if="canComplete(item)"
                type="button"
                class="confirm-btn"
                :disabled="isAppointmentActionBusy(item.id)"
                @click="openCompletionModal(item)"
              >
                Hoàn tất
              </button>
              <button
                v-if="canComplete(item)"
                type="button"
                class="secondary-btn"
                :disabled="isAppointmentActionBusy(item.id)"
                @click="markAppointmentNoShow(item)"
              >
                Vắng mặt
              </button>
            </div>

            <p v-if="appointmentActionId === item.id && appointmentActionError" class="msg err compact-msg">
              {{ appointmentActionError }}
            </p>
            <p v-if="appointmentActionId === item.id && appointmentActionMessage" class="msg ok compact-msg">
              {{ appointmentActionMessage }}
            </p>
          </div>
        </article>
      </div>

      <div
        v-if="!appointments.loading && !appointments.error && filteredTodayItems.length > 0 && timelineTotalPages > 1"
        class="row pager timeline-pager"
      >
        <button type="button" :disabled="timelinePage <= 1" @click="prevTimelinePage">Trước</button>
        <span>Trang {{ timelinePage }} / {{ timelineTotalPages }}</span>
        <button type="button" :disabled="timelinePage >= timelineTotalPages" @click="nextTimelinePage">Sau</button>
      </div>
    </section>

    <section class="panel completion-panel">
      <div class="timeline-head">
        <h2>Xác nhận đã khám xong và tạo hóa đơn</h2>
        <small>{{ completionRows.length }} ca sẵn sàng hoàn tất</small>
      </div>

      <p class="muted">
        Bác sĩ nhập tay dịch vụ, số tiền và ghi chú trước khi xác nhận hoàn tất ca khám để tạo hóa đơn cho bệnh nhân.
      </p>

      <p v-if="appointments.loading" class="muted">Đang tải ca khám có thể hoàn tất...</p>
      <p v-else-if="appointments.error" class="msg err">{{ appointments.error }}</p>

      <DataTable
        v-else
        :columns="completionColumns"
        :rows="completionRows"
        row-key="id"
        empty-text="Không có ca nào cần hoàn tất lúc này."
      >
        <template #cell-actions="{ row }">
          <div class="row actions">
            <RouterLink
              v-if="canEnterConsultation(row)"
              class="consult-link"
              :to="`/doctor/consultation/${encodeURIComponent(row.patientId)}`"
            >
              Vào ca khám
            </RouterLink>
            <button
              type="button"
              class="confirm-btn"
              :disabled="isAppointmentActionBusy(row.id)"
              @click="openCompletionModal(row)"
            >
              Hoàn tất
            </button>
          </div>
        </template>
      </DataTable>
    </section>

    <div v-if="invoiceModalOpen" class="invoice-modal-backdrop" @click.self="closeCompletionModal">
      <section class="panel invoice-modal">
        <div class="invoice-modal-head">
          <div>
            <h2>Tạo hóa đơn dịch vụ</h2>
            <p>
              Bệnh nhân: <strong>{{ invoiceTargetAppointment?.patientName || '-' }}</strong>
              · Khung giờ: <strong>{{ invoiceTargetAppointment?.timeRange || '-' }}</strong>
            </p>
          </div>
          <button type="button" @click="closeCompletionModal" :disabled="appointmentActionLoading">Đóng</button>
        </div>

        <form class="invoice-form" @submit.prevent="submitCompletionAndCreateInvoice">
          <label>
            <span>Dịch vụ</span>
            <input v-model.trim="invoiceForm.serviceName" type="text" placeholder="Ví dụ: Khám tổng quát" required />
          </label>

          <label>
            <span>Số tiền (VND)</span>
            <input v-model="invoiceForm.amount" type="number" min="1000" step="1000" required />
          </label>

          <label>
            <span>Hạn thanh toán</span>
            <input v-model="invoiceForm.dueDate" type="date" />
          </label>

          <label>
            <span>Ghi chú</span>
            <textarea v-model.trim="invoiceForm.note" rows="3" placeholder="Thông tin bổ sung cho hóa đơn"></textarea>
          </label>

          <div class="row actions">
            <button type="submit" class="confirm-btn" :disabled="appointmentActionLoading">
              {{ appointmentActionLoading ? 'Đang xử lý...' : 'Xác nhận khám xong + tạo hóa đơn' }}
            </button>
            <button type="button" :disabled="appointmentActionLoading" @click="closeCompletionModal">Hủy</button>
          </div>

          <p v-if="invoiceModalError" class="msg err compact-msg">{{ invoiceModalError }}</p>
        </form>
      </section>
    </div>

    <section class="panel payments-panel">
      <div class="timeline-head">
        <h2>Yêu cầu xác nhận chuyển khoản</h2>
        <small>{{ pendingPaymentRows.length }} yêu cầu chờ bác sĩ xử lý</small>
      </div>

      <p v-if="billing.doctorPendingLoading" class="muted">Đang tải yêu cầu thanh toán...</p>
      <p v-else-if="billing.doctorPendingError" class="msg err">{{ billing.doctorPendingError }}</p>

      <DataTable
        v-else
        :columns="paymentColumns"
        :rows="pendingPaymentRows"
        row-key="id"
        empty-text="Không có yêu cầu thanh toán cần xác nhận."
      >
        <template #cell-amount="{ value }">{{ formatMoney(value) }}</template>
        <template #cell-submittedAt="{ value }">{{ formatDateTime(value) }}</template>
        <template #cell-actions="{ row }">
          <div class="row actions">
            <button
              type="button"
              class="confirm-btn"
              :disabled="billing.reviewingPayment"
              @click="reviewPayment(row, 'confirm')"
            >
              Xác nhận
            </button>
            <button
              type="button"
              class="reject-btn"
              :disabled="billing.reviewingPayment"
              @click="reviewPayment(row, 'reject')"
            >
              Từ chối
            </button>
          </div>
        </template>
      </DataTable>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useAppointmentsStore } from '../../stores/appointments.js';
import { useBillingStore } from '../../stores/billing.js';
import DataTable from '../../components/shared/DataTable.vue';

const appointments = useAppointmentsStore();
const billing = useBillingStore();
const statusFilter = ref('all');
const appointmentActionId = ref('');
const appointmentActionLoading = ref(false);
const appointmentActionMessage = ref('');
const appointmentActionError = ref('');
const invoiceModalOpen = ref(false);
const invoiceModalError = ref('');
const invoiceTargetAppointment = ref(null);
const timelinePage = ref(1);
const invoiceForm = reactive({
  serviceName: '',
  amount: '',
  dueDate: '',
  note: '',
});
const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;
const TIMELINE_PAGE_SIZE = 3;
let dashboardRefreshTimer = null;

const decisionStatuses = new Set(['pending', 'requested']);
const completableStatuses = new Set([
  'scheduled',
  'in_progress',
  'in-progress',
  'confirmed',
  'rescheduled',
  'accepted',
  'waiting',
  'dang_cho',
  'đang chờ',
  'dang kham',
  'đang khám',
]);
const waitingStatuses = new Set(['pending', 'scheduled', 'rescheduled', 'requested', 'confirmed']);
const inProgressStatuses = new Set(['in_progress']);
const completedStatuses = new Set(['completed', 'done']);
const cancelledStatuses = new Set(['cancelled', 'canceled', 'rejected']);
const noShowStatuses = new Set(['no_show']);
const nonConsultableStatuses = new Set(['cancelled', 'canceled', 'rejected', 'no_show', 'no-show']);

const resolveVisualStatus = (status) => {
  if (waitingStatuses.has(status)) return 'waiting';
  if (inProgressStatuses.has(status) || status === 'in-progress') return 'in-progress';
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
        status,
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

const timelineTotalPages = computed(() => {
  const totalItems = filteredTodayItems.value.length;
  return Math.max(1, Math.ceil(totalItems / TIMELINE_PAGE_SIZE));
});

const pagedTodayItems = computed(() => {
  const safePage = Math.min(Math.max(1, timelinePage.value), timelineTotalPages.value);
  const startIndex = (safePage - 1) * TIMELINE_PAGE_SIZE;
  return filteredTodayItems.value.slice(startIndex, startIndex + TIMELINE_PAGE_SIZE);
});

const totalToday = computed(() => todayItems.value.length);
const waitingCount = computed(() => todayItems.value.filter((item) => item.visualStatus === 'waiting' || item.visualStatus === 'in-progress').length);
const completedCount = computed(() => todayItems.value.filter((item) => item.visualStatus === 'completed').length);

const completionColumns = [
  { key: 'timeRange', label: 'Khung giờ', width: '180px' },
  { key: 'patientName', label: 'Bệnh nhân', width: '190px' },
  { key: 'reason', label: 'Lý do khám' },
  { key: 'statusLabel', label: 'Trạng thái', width: '150px' },
  { key: 'actions', label: 'Thao tác', width: '280px' },
];

const completionRows = computed(() => {
  return normalizedItems.value.filter((item) => canComplete(item));
});

const paymentColumns = [
  { key: 'invoiceNumber', label: 'Hóa đơn', width: '160px' },
  { key: 'patientName', label: 'Bệnh nhân', width: '180px' },
  { key: 'amount', label: 'Số tiền', width: '150px', align: 'right' },
  { key: 'transferReference', label: 'Mã giao dịch', width: '170px' },
  { key: 'submittedAt', label: 'Thời gian gửi', width: '170px' },
  { key: 'actions', label: 'Thao tác', width: '210px' },
];

const pendingPaymentRows = computed(() => {
  return billing.doctorPendingPayments.map((item, index) => ({
    id: item.id || item.paymentId || `pending-payment-${index + 1}`,
    invoiceNumber: item.invoiceNumber || item.invoiceId || '-',
    patientName: item.patientName || item.patientId || '-',
    amount: Number(item.amount) || 0,
    transferReference: item.transferReference || '-',
    submittedAt: item.createdAt || null,
  }));
});

const formatMoney = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '-';
  return `${amount.toLocaleString('vi-VN')} VND`;
};

const formatDateTime = (value) => {
  const d = new Date(value || '');
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildTodayScheduleFilters = () => {
  return {
    page: 1,
    pageSize: 500,
  };
};

const isAppointmentActionBusy = (appointmentId) => {
  return appointmentActionLoading.value && appointmentActionId.value === appointmentId;
};

const canEnterConsultation = (item) => {
  if (!item?.patientId) return false;
  const normalized = String(item?.status || '').toLowerCase();
  return !nonConsultableStatuses.has(normalized);
};

const canDecide = (item) => decisionStatuses.has(String(item?.status || '').toLowerCase());

const canComplete = (item) => completableStatuses.has(String(item?.status || '').toLowerCase());

const prevTimelinePage = () => {
  if (timelinePage.value <= 1) return;
  timelinePage.value -= 1;
};

const nextTimelinePage = () => {
  if (timelinePage.value >= timelineTotalPages.value) return;
  timelinePage.value += 1;
};

watch(statusFilter, () => {
  timelinePage.value = 1;
});

watch(filteredTodayItems, () => {
  const maxPage = timelineTotalPages.value;
  if (timelinePage.value > maxPage) {
    timelinePage.value = maxPage;
  }
});

const runAppointmentAction = async ({ item, payload, successMessage }) => {
  if (!item?.id || appointmentActionLoading.value) return;

  appointmentActionId.value = item.id;
  appointmentActionLoading.value = true;
  appointmentActionMessage.value = '';
  appointmentActionError.value = '';

  try {
    const result = await appointments.updateStatus(item.id, payload);
    appointmentActionMessage.value = typeof successMessage === 'function'
      ? successMessage(result)
      : successMessage;
    return { ok: true, result };
  } catch (error) {
    appointmentActionError.value = error?.message || 'Không thể cập nhật trạng thái lịch hẹn.';
    return { ok: false, error };
  } finally {
    appointmentActionLoading.value = false;
  }
};

const resetInvoiceForm = () => {
  invoiceForm.serviceName = '';
  invoiceForm.amount = '';
  invoiceForm.dueDate = '';
  invoiceForm.note = '';
};

const openCompletionModal = (item) => {
  if (!item?.id) return;
  invoiceTargetAppointment.value = item;
  invoiceModalOpen.value = true;
  invoiceModalError.value = '';
  resetInvoiceForm();
  invoiceForm.serviceName = item.reason || '';
};

const closeCompletionModal = () => {
  invoiceModalOpen.value = false;
  invoiceModalError.value = '';
  invoiceTargetAppointment.value = null;
};

const decideAppointment = async (item, decision) => {
  const successMessage = decision === 'accept'
    ? 'Đã chấp nhận lịch hẹn.'
    : 'Đã từ chối lịch hẹn.';

  await runAppointmentAction({
    item,
    payload: { decision },
    successMessage,
  });
};

const submitCompletionAndCreateInvoice = async () => {
  const item = invoiceTargetAppointment.value;
  if (!item?.id) return;

  const serviceName = String(invoiceForm.serviceName || '').trim();
  const amount = Number(invoiceForm.amount);
  if (!serviceName) {
    invoiceModalError.value = 'Vui lòng nhập tên dịch vụ.';
    return;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    invoiceModalError.value = 'Vui lòng nhập số tiền hợp lệ lớn hơn 0.';
    return;
  }

  invoiceModalError.value = '';

  const actionResult = await runAppointmentAction({
    item,
    payload: {
      status: 'completed',
      invoiceDetails: {
        serviceName,
        amount,
        note: String(invoiceForm.note || '').trim() || undefined,
        dueDate: invoiceForm.dueDate || undefined,
      },
    },
    successMessage: (result) => {
      if (result?.billingCreated && result?.invoiceNumber) {
        return `Đã xác nhận khám xong và tạo hóa đơn ${result.invoiceNumber}.`;
      }
      if (result?.invoiceNumber) {
        return `Đã xác nhận khám xong. Hóa đơn ${result.invoiceNumber} đã tồn tại từ trước.`;
      }
      return 'Đã xác nhận khám xong và tạo hóa đơn dịch vụ cho bệnh nhân.';
    },
  });

  if (!actionResult?.ok) {
    invoiceModalError.value = appointmentActionError.value || 'Không thể tạo hóa đơn cho ca khám này.';
    return;
  }

  closeCompletionModal();
};

const markAppointmentNoShow = async (item) => {
  await runAppointmentAction({
    item,
    payload: { status: 'no_show' },
    successMessage: 'Đã đánh dấu bệnh nhân vắng mặt cho lịch hẹn này.',
  });
};

const refresh = async () => {
  if (!appointments.loading) {
    try {
      await appointments.fetchAppointments(buildTodayScheduleFilters());
    } catch {
      // Error state is handled inside appointments store.
    }
  }

  if (!billing.doctorPendingLoading) {
    try {
      await billing.fetchDoctorPendingPayments();
    } catch {
      // Error state is handled inside billing store.
    }
  }
};

const reviewPayment = async (row, decision) => {
  if (!row?.id) return;
  try {
    await billing.reviewDoctorPayment(row.id, { decision });
  } catch {
    // Error state is handled inside billing store.
  }
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

.consult-actions {
  margin-top: 10px;
  gap: 8px;
  flex-wrap: wrap;
}

.consult-actions .consult-link {
  margin-top: 0;
}

.compact-msg {
  margin-top: 8px;
  margin-bottom: 0;
}

.completion-panel {
  display: grid;
  gap: 12px;
}

.invoice-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 80;
  display: grid;
  align-items: center;
  justify-items: center;
  padding: 20px;
}

.invoice-modal {
  width: min(640px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  margin: 0;
  display: grid;
  gap: 12px;
}

.invoice-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.invoice-modal-head h2 {
  margin: 0;
}

.invoice-modal-head p {
  margin: 8px 0 0;
  color: #334155;
}

.invoice-form {
  display: grid;
  gap: 12px;
}

.invoice-form label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.payments-panel {
  display: grid;
  gap: 12px;
}

.actions {
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.actions .consult-link {
  margin-top: 0;
}

.timeline-pager {
  justify-content: flex-end;
  align-items: center;
}

.timeline-pager span {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
}

.confirm-btn {
  border-color: #22c55e;
  background: #dcfce7;
  color: #166534;
}

.secondary-btn {
  border-color: #f59e0b;
  background: #fef3c7;
  color: #92400e;
}

.reject-btn {
  border-color: #ef4444;
  background: #fee2e2;
  color: #991b1b;
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

