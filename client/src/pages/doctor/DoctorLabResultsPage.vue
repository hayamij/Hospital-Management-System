<template>
  <div class="page">
    <header class="panel doctor-header">
      <div class="header-copy">
        <p class="eyebrow">LAB REVIEW</p>
        <h1>Quản lý kết quả xét nghiệm</h1>
        <p>Đối chiếu lịch khám, duyệt kết quả và lưu nhận xét chuyên môn theo quy trình chuẩn.</p>
      </div>

      <div class="header-actions">
        <span class="pager-inline-label">Trang {{ schedulePage }} / {{ scheduleTotalPages }}</span>
        <button type="button" @click="refreshSchedule" :disabled="loadingSchedule">Làm mới lịch khám</button>
      </div>
    </header>

    <section class="kpi-grid">
      <article class="panel kpi-card primary">
        <p class="kpi-label">Lịch khám gần đây</p>
        <p class="kpi-value">{{ scheduleItems.length }}</p>
        <p class="kpi-note">Tổng số lịch hiển thị trong vùng thao tác hiện tại.</p>
      </article>

      <article class="panel kpi-card waiting">
        <p class="kpi-label">Ca đang xử lý</p>
        <p class="kpi-value">{{ pendingScheduleCount }}</p>
        <p class="kpi-note">Bao gồm lịch đang chờ hoặc đang khám.</p>
      </article>

      <article class="panel kpi-card done">
        <p class="kpi-label">Lần duyệt gần đây</p>
        <p class="kpi-value">{{ labResults.recentReviews.length }}</p>
        <p class="kpi-note">Số log review được lưu gần nhất trong phiên làm việc.</p>
      </article>
    </section>

    <section class="panel">
      <div class="section-head">
        <h2>Danh sách lịch khám gần đây</h2>
        <small>Dùng để điền nhanh thông tin bệnh nhân trước khi duyệt xét nghiệm · Trang {{ schedulePage }} / {{ scheduleTotalPages }}</small>
      </div>

      <p v-if="loadingSchedule" class="muted">Đang tải lịch khám...</p>
      <p v-else-if="scheduleError" class="msg err">{{ scheduleError }}</p>
      <div v-else-if="scheduleItems.length === 0">Chưa có lịch khám.</div>
      <div v-else class="list-grid">
        <article v-for="item in scheduleItems" :key="item.id" class="item schedule-item">
          <div>
            <p><strong>{{ item.reason }}</strong></p>
            <p>Bệnh nhân: {{ item.patientId || 'Không rõ' }}</p>
            <p>Khung giờ: {{ item.startAt }} -> {{ item.endAt }}</p>
            <p>Trạng thái lịch hẹn: {{ item.status }}</p>
          </div>
          <div class="row">
            <button type="button" @click="applyFromAppointment(item)">Điền nhanh</button>
          </div>
        </article>
      </div>

      <div class="schedule-pager" role="group" aria-label="Phân trang lịch khám">
        <span class="pager-inline-label">Mỗi trang</span>
        <select v-model.number="schedulePageSize" :disabled="loadingSchedule" @change="changeSchedulePageSize">
          <option v-for="size in schedulePageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
        <button type="button" :disabled="loadingSchedule || schedulePage <= 1" @click="goToPrevSchedulePage">Trang trước</button>
        <button type="button" :disabled="loadingSchedule || schedulePage >= scheduleTotalPages" @click="goToNextSchedulePage">Trang sau</button>
      </div>
    </section>

    <section class="panel">
      <div class="section-head">
        <h2>Duyệt kết quả xét nghiệm</h2>
        <small>Điền nhận xét và lưu kết quả review theo mã xét nghiệm</small>
      </div>

      <form class="review-form" @submit.prevent="submitReview">
        <div class="review-layout">
          <div class="review-key-fields">
            <label class="form-field">
              <span>Mã kết quả xét nghiệm</span>
              <input v-model.trim="reviewForm.labResultId" required placeholder="lab-result-001" />
            </label>

            <label class="form-field">
              <span>Mã bệnh nhân (tham chiếu nội bộ)</span>
              <input v-model.trim="reviewForm.patientId" placeholder="patient-001" />
            </label>
          </div>

          <label class="form-field review-notes">
            <span>Nhận xét của bác sĩ</span>
            <textarea
              v-model.trim="reviewForm.notes"
              rows="6"
              required
              placeholder="Nhận xét, khuyến nghị, chỉ định tiếp theo..."
            ></textarea>
          </label>
        </div>

        <div class="row review-actions">
          <button type="submit" :disabled="labResults.reviewing">Duyệt kết quả</button>
          <button type="button" @click="resetForm" :disabled="labResults.reviewing">Xóa form</button>
        </div>
      </form>

      <p v-if="labResults.success" class="msg ok">{{ labResults.success }}</p>
      <p v-if="labResults.error" class="msg err">{{ labResults.error }}</p>
    </section>

    <section class="panel" v-if="labResults.recentReviews.length > 0">
      <div class="section-head">
        <h2>Lần duyệt gần đây</h2>
        <small>Nhật ký review phục vụ kiểm tra nhanh trong ca trực</small>
      </div>
      <div class="list-grid">
        <article v-for="row in labResults.recentReviews" :key="row.reviewedAt + row.labResultId" class="item review-item">
          <div>
            <p><strong>{{ row.labResultId }}</strong></p>
            <p>Bệnh nhân: {{ row.patientId || 'Không ghi nhận' }}</p>
            <p>Thời gian duyệt: {{ row.reviewedAt }}</p>
            <p>Nhận xét: {{ row.notes }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAppointmentsStore } from '../../stores/appointments.js';
import { useDoctorLabResultsStore } from '../../stores/doctorLabResults.js';
import { mapDoctorScheduleItems } from '../controllers/doctor/doctorLabResultsController.js';

const appointments = useAppointmentsStore();
const labResults = useDoctorLabResultsStore();

const loadingSchedule = ref(false);
const scheduleError = ref('');
const schedulePage = ref(1);
const schedulePageSize = ref(10);
const schedulePageSizeOptions = [10, 20, 50];

const reviewForm = reactive({
  labResultId: '',
  patientId: '',
  notes: '',
});

const scheduleItems = computed(() => {
  return mapDoctorScheduleItems(appointments.items);
});

const pendingScheduleCount = computed(() => {
  return scheduleItems.value.filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return status === 'pending' || status === 'requested' || status === 'in_progress' || status === 'scheduled';
  }).length;
});

const scheduleTotalPages = computed(() => {
  const total = Number(appointments.total) || 0;
  const size = Number(schedulePageSize.value) || 10;
  return Math.max(1, Math.ceil(total / size));
});

const refreshSchedule = async ({ resetPage = false } = {}) => {
  if (resetPage) {
    schedulePage.value = 1;
  }

  loadingSchedule.value = true;
  scheduleError.value = '';
  try {
    await appointments.fetchAppointments({
      page: schedulePage.value,
      pageSize: schedulePageSize.value,
    });

    schedulePage.value = Number(appointments.page) || schedulePage.value;
    schedulePageSize.value = Number(appointments.pageSize) || schedulePageSize.value;
  } catch (e) {
    scheduleError.value = e?.message || 'Không thể tải lịch khám.';
  } finally {
    loadingSchedule.value = false;
  }
};

const changeSchedulePageSize = async () => {
  schedulePage.value = 1;
  await refreshSchedule();
};

const goToPrevSchedulePage = async () => {
  if (schedulePage.value <= 1) return;
  schedulePage.value -= 1;
  await refreshSchedule();
};

const goToNextSchedulePage = async () => {
  if (schedulePage.value >= scheduleTotalPages.value) return;
  schedulePage.value += 1;
  await refreshSchedule();
};

const applyFromAppointment = (item) => {
  reviewForm.patientId = item.patientId || '';
};

const submitReview = async () => {
  try {
    await labResults.reviewLabResult({
      labResultId: reviewForm.labResultId,
      patientId: reviewForm.patientId,
      notes: reviewForm.notes,
    });
    reviewForm.labResultId = '';
    reviewForm.notes = '';
  } catch {
    // error message is managed in store
  }
};

const resetForm = () => {
  reviewForm.labResultId = '';
  reviewForm.patientId = '';
  reviewForm.notes = '';
  labResults.clearMessages();
};

onMounted(() => {
  void refreshSchedule({ resetPage: true });
});
</script>

<style scoped>
.doctor-header {
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
  background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
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

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.section-head h2 {
  margin: 0;
}

.section-head small {
  color: #64748b;
}

.review-form {
  display: grid;
  gap: 14px;
}

.review-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 14px;
  align-items: start;
}

.review-key-fields {
  display: grid;
  gap: 14px;
}

.form-field {
  display: grid;
  gap: 8px;
  align-content: start;
}

.form-field span {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: #334155;
}

.review-notes textarea {
  min-height: 176px;
}

.review-actions {
  align-items: center;
}

.review-actions button {
  min-width: 138px;
}

.item {
  display: grid;
  gap: 14px;
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  padding: 14px;
}

.schedule-item {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.review-item {
  grid-template-columns: 1fr;
}

.schedule-item p,
.review-item p {
  margin: 0 0 6px;
  color: #334155;
}

.schedule-pager {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.pager-inline-label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

@media (max-width: 900px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .review-layout {
    grid-template-columns: 1fr;
  }

  .schedule-item {
    grid-template-columns: 1fr;
  }
}
</style>

