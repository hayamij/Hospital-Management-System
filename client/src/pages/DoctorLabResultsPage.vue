<template>
  <div class="page">
    <header class="panel">
      <h1>Quản lý kết quả xét nghiệm</h1>
      <p>Duyệt kết quả xét nghiệm bằng endpoint dành riêng cho bác sĩ.</p>
      <div class="row">
        <button type="button" @click="refreshSchedule" :disabled="loadingSchedule">Làm mới lịch khám</button>
      </div>
    </header>

    <section class="panel">
      <h2>Danh sách lịch khám gần đây</h2>
      <p class="muted">Bảng này giúp bác sĩ tra nhanh bệnh nhân và ca khám trước khi duyệt kết quả xét nghiệm.</p>
      <p v-if="loadingSchedule" class="muted">Đang tải lịch khám...</p>
      <p v-else-if="scheduleError" class="msg err">{{ scheduleError }}</p>
      <div v-else-if="scheduleItems.length === 0">Chưa có lịch khám.</div>
      <div v-else class="list-grid">
        <article v-for="item in scheduleItems" :key="item.id" class="item">
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
    </section>

    <section class="panel">
      <h2>Duyệt kết quả xét nghiệm</h2>
      <form class="grid two" @submit.prevent="submitReview">
        <label>
          <span>Mã kết quả xét nghiệm</span>
          <input v-model.trim="reviewForm.labResultId" required placeholder="lab-result-001" />
        </label>

        <label>
          <span>Mã bệnh nhân (tham chiếu nội bộ)</span>
          <input v-model.trim="reviewForm.patientId" placeholder="patient-001" />
        </label>

        <label class="full-row">
          <span>Nhận xét của bác sĩ</span>
          <textarea v-model.trim="reviewForm.notes" rows="4" required placeholder="Nhận xét, khuyến nghị, chỉ định tiếp theo..."></textarea>
        </label>

        <div class="row full-row">
          <button type="submit" :disabled="labResults.reviewing">Duyệt kết quả</button>
          <button type="button" @click="resetForm" :disabled="labResults.reviewing">Xóa form</button>
        </div>
      </form>

      <p v-if="labResults.success" class="msg ok">{{ labResults.success }}</p>
      <p v-if="labResults.error" class="msg err">{{ labResults.error }}</p>
    </section>

    <section class="panel" v-if="labResults.recentReviews.length > 0">
      <h2>Lần duyệt gần đây</h2>
      <div class="list-grid">
        <article v-for="row in labResults.recentReviews" :key="row.reviewedAt + row.labResultId" class="item">
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
import { useAppointmentsStore } from '../stores/appointments.js';
import { useDoctorLabResultsStore } from '../stores/doctorLabResults.js';
import { mapDoctorScheduleItems } from './controllers/doctorLabResultsController.js';

const appointments = useAppointmentsStore();
const labResults = useDoctorLabResultsStore();

const loadingSchedule = ref(false);
const scheduleError = ref('');

const reviewForm = reactive({
  labResultId: '',
  patientId: '',
  notes: '',
});

const scheduleItems = computed(() => {
  return mapDoctorScheduleItems(appointments.items);
});

const refreshSchedule = async () => {
  loadingSchedule.value = true;
  scheduleError.value = '';
  try {
    await appointments.fetchAppointments();
  } catch (e) {
    scheduleError.value = e?.message || 'Không thể tải lịch khám.';
  } finally {
    loadingSchedule.value = false;
  }
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

onMounted(refreshSchedule);
</script>

<style scoped>
.two { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.full-row { grid-column: 1 / -1; }
.item { display: grid; gap: 14px; grid-template-columns: 1fr auto; }
@media (max-width: 900px) {
  .item { grid-template-columns: 1fr; }
}
</style>
