<template>
  <div class="patient-dashboard">
    <section class="panel spotlight">
      <div class="spotlight-head">
        <div>
          <p class="eyebrow">Upcoming Appointment</p>
          <h1>Lich kham sap toi</h1>
        </div>
        <RouterLink class="quick-action" to="/patient/booking">Đặt lịch khám</RouterLink>
      </div>

      <p v-if="loading" class="message">Dang tai du lieu lich kham...</p>
      <p v-else-if="upcomingError" class="message err">{{ upcomingError }}</p>

      <div v-else-if="upcomingAppointment" class="appointment-card">
        <h2>{{ upcomingAppointment.serviceName }}</h2>
        <p><strong>Bac si:</strong> {{ upcomingAppointment.doctorName }}</p>
        <p><strong>Ngay kham:</strong> {{ formatDate(upcomingAppointment.date) }}</p>
        <p><strong>Trang thai:</strong> {{ upcomingAppointment.status }}</p>
      </div>

      <p v-else class="message">Ban chua co lich kham sap toi. Hay dat lich moi ngay hom nay.</p>
    </section>

    <section class="panel">
      <header class="section-head">
        <h2>3 ket qua kham / hoa don gan nhat</h2>
        <RouterLink to="/patient/records" class="view-all">Xem ho so benh an</RouterLink>
      </header>

      <p v-if="loading" class="message">Dang tai danh sach tom tat...</p>
      <p v-else-if="summaryError" class="message err">{{ summaryError }}</p>

      <div v-else-if="latestSummary.length > 0" class="summary-list">
        <article v-for="item in latestSummary" :key="item.key" class="summary-item">
          <p class="meta">{{ item.type }} · {{ formatDate(item.date) }}</p>
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
          <p class="amount" v-if="item.amount !== null">So tien: {{ formatMoney(item.amount) }}</p>
        </article>
      </div>

      <p v-else class="message">Chua co du lieu ket qua kham hoac hoa don gan day.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAppointmentsStore } from '../stores/appointments.js';
import { useRecordsStore } from '../stores/records.js';
import { useBillingStore } from '../stores/billing.js';

const appointmentsStore = useAppointmentsStore();
const recordsStore = useRecordsStore();
const billingStore = useBillingStore();

const loading = ref(false);
const upcomingError = ref('');
const summaryError = ref('');

const toTimestamp = (value) => {
  const t = new Date(value || '').getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
};

const toAppointmentModel = (source, index = 0) => ({
  key: source?.id || source?.appointmentId || `appointment-${index + 1}`,
  date: source?.appointmentDate || source?.date || source?.scheduledAt || '',
  serviceName: source?.serviceName || source?.reason || source?.service || 'Kham tong quat',
  doctorName: source?.doctorName || source?.doctorFullName || source?.doctor || 'Dang cap nhat',
  status: source?.status || 'pending',
});

const toRecordModel = (source, index = 0) => ({
  key: `record-${source?.id || index + 1}`,
  type: 'Ket qua kham',
  date: source?.visitDate || source?.createdAt || source?.updatedAt || '',
  title: source?.title || source?.diagnosis || 'Phieu ket qua kham',
  description: source?.summary || source?.note || source?.result || 'Thong tin ket qua dang duoc cap nhat.',
  amount: null,
});

const toInvoiceModel = (source, index = 0) => ({
  key: `billing-${source?.id || source?.invoiceId || index + 1}`,
  type: 'Hoa don',
  date: source?.issuedAt || source?.createdAt || source?.updatedAt || '',
  title: source?.title || source?.code || source?.invoiceNumber || 'Hoa don dich vu',
  description: source?.note || source?.status || 'Thong tin hoa don gan nhat.',
  amount: source?.amount ?? source?.totalAmount ?? null,
});

const formatDate = (value) => {
  const d = new Date(value || '');
  if (Number.isNaN(d.getTime())) return 'Chua xac dinh';
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatMoney = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'Dang cap nhat';
  }
  return Number(value).toLocaleString('vi-VN') + ' VND';
};

const upcomingAppointment = computed(() => {
  const now = Date.now();
  const normalized = appointmentsStore.items.map(toAppointmentModel);
  const future = normalized
    .filter((item) => toTimestamp(item.date) >= now)
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date));

  return future[0] || null;
});

const latestSummary = computed(() => {
  const recordItems = recordsStore.list.map(toRecordModel);
  const billingItems = billingStore.invoices.map(toInvoiceModel);

  return [...recordItems, ...billingItems]
    .sort((a, b) => toTimestamp(a.date) - toTimestamp(b.date))
    .reverse()
    .slice(0, 3);
});

const loadDashboard = async () => {
  loading.value = true;
  upcomingError.value = '';
  summaryError.value = '';

  const [appointmentsResult, recordsResult, billingResult] = await Promise.allSettled([
    appointmentsStore.fetchAppointments({ page: 1, pageSize: 20 }),
    recordsStore.fetchRecords({}),
    billingStore.fetchBilling({ page: 1, pageSize: 10 }),
  ]);

  if (appointmentsResult.status === 'rejected') {
    upcomingError.value = appointmentsResult.reason?.message || 'Khong the tai lich kham sap toi.';
  }

  if (recordsResult.status === 'rejected' || billingResult.status === 'rejected') {
    summaryError.value = 'Khong the tai day du du lieu ket qua kham/hoa don. Vui long thu lai sau.';
  }

  loading.value = false;
};

onMounted(loadDashboard);
</script>

<style scoped>
.patient-dashboard {
  display: grid;
  gap: 20px;
}

.spotlight {
  border: 1px solid #93c5fd;
  background: linear-gradient(120deg, #eff6ff 0%, #f8fafc 100%);
}

.spotlight-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #1d4ed8;
}

.spotlight h1 {
  margin: 8px 0 0;
  font-size: 30px;
}

.quick-action {
  min-height: 44px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
  text-decoration: none;
}

.appointment-card {
  margin-top: 18px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 16px;
}

.appointment-card h2 {
  margin: 0 0 10px;
  font-size: 22px;
}

.appointment-card p {
  margin: 0 0 8px;
  color: #334155;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.section-head h2 {
  margin: 0;
}

.view-all {
  color: #1d4ed8;
  text-decoration: none;
}

.summary-list {
  margin-top: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.summary-item {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 14px;
}

.meta {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.summary-item h3 {
  margin: 8px 0;
  font-size: 18px;
}

.summary-item p {
  margin: 0;
  color: #334155;
}

.amount {
  margin-top: 10px !important;
  color: #0f766e !important;
  font-weight: 600;
}

.message {
  margin: 16px 0 0;
}

.message.err {
  color: #b91c1c;
}

@media (max-width: 900px) {
  .spotlight h1 {
    font-size: 25px;
  }
}
</style>
