<template>
  <div class="booking-page">
    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">Đặt lịch nhiều bước</p>
          <h1>Đặt lịch khám theo 4 bước thông minh</h1>
          <p>Chọn chuyên khoa, bác sĩ, khung giờ, triệu chứng và xác nhận lịch hẹn.</p>
          <div class="context-chips" v-if="selectedDoctorFromQuery || selectedServiceName">
            <span v-if="selectedDoctorFromQuery" class="chip">Đã chọn bác sĩ: {{ selectedDoctorFromQuery }}</span>
            <span v-if="selectedServiceName" class="chip">Đã chọn dịch vụ: {{ selectedServiceName }}</span>
          </div>
        </div>

        <aside class="hero-side">
          <p class="hero-side-title">Tóm tắt đặt lịch</p>
          <p><strong>Chuyên khoa:</strong> {{ booking.form.specialty || 'Chưa chọn' }}</p>
          <p><strong>Bác sĩ:</strong> {{ booking.selectedDoctor?.name || 'Chưa chọn' }}</p>
          <p><strong>Ngày:</strong> {{ booking.form.appointmentDate || 'Chưa chọn' }}</p>
        </aside>
      </div>
    </header>

    <section class="panel">
      <ol class="steps">
        <li :class="{ active: booking.step === 1, done: booking.step > 1 }">1. Chọn chuyên khoa/bác sĩ</li>
        <li :class="{ active: booking.step === 2, done: booking.step > 2 }">2. Chọn ngày và khung giờ</li>
        <li :class="{ active: booking.step === 3, done: booking.step > 3 }">3. Điền triệu chứng lâm sàng</li>
        <li :class="{ active: booking.step === 4 }">4. Xác nhận và tạo cuộc hẹn</li>
      </ol>

      <div v-if="booking.step === 1" class="step-body">
        <h2>Bước 1: Chọn chuyên khoa và bác sĩ</h2>
        <div class="grid two-col">
          <label class="field">
            <span>Chuyên khoa</span>
            <select :value="booking.form.specialty" @change="onSpecialtyChange">
              <option value="">Chọn chuyên khoa</option>
              <option v-for="item in booking.specialties" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label class="field">
            <span>Bác sĩ</span>
            <select :value="booking.form.doctorId" @change="onDoctorChange">
              <option value="">Chọn bác sĩ</option>
              <option v-for="doc in booking.filteredDoctors" :key="doc.id" :value="doc.id">
                {{ doc.name }} - {{ doc.specialty }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="booking.step === 2" class="step-body">
        <h2>Bước 2: Chọn ngày và khung giờ</h2>
        <div class="grid two-col slot-controls">
          <label class="field">
            <span>Ngày khám</span>
            <input type="date" :value="booking.form.appointmentDate" @input="onDateInput" />
          </label>
          <div class="field action-field">
            <span>&nbsp;</span>
            <button type="button" @click="loadSlots" :disabled="booking.loadingSlots">
              {{ booking.loadingSlots ? 'Đang kiểm tra...' : 'Kiểm tra giờ trống' }}
            </button>
          </div>
        </div>

        <p v-if="booking.loadingSlots" class="muted">Đang tải khung giờ trống...</p>
        <p v-else-if="booking.availableSlots.length === 0" class="muted">{{ emptySlotMessage }}</p>

        <div v-else class="slot-grid">
          <button
            v-for="slot in booking.availableSlots"
            :key="slot.id"
            type="button"
            class="slot-btn"
            :class="{ selected: booking.form.slotStart === slot.start }"
            @click="booking.selectSlot(slot)"
          >
            {{ slot.label }}
          </button>
        </div>
      </div>

      <div v-if="booking.step === 3" class="step-body">
        <h2>Bước 3: Triệu chứng lâm sàng</h2>
        <label class="field">
          <span>Mô tả triệu chứng</span>
          <textarea
            v-model="booking.form.clinicalSymptoms"
            rows="5"
            placeholder="Nhập triệu chứng, thời gian khởi phát và tiền sử liên quan..."
          ></textarea>
        </label>
      </div>

      <div v-if="booking.step === 4" class="step-body">
        <h2>Bước 4: Xác nhận thông tin</h2>
        <article class="confirm-card">
          <p><strong>Chuyên khoa:</strong> {{ booking.form.specialty || 'Chưa chọn' }}</p>
          <p><strong>Bác sĩ:</strong> {{ booking.selectedDoctor?.name || 'Chưa chọn' }}</p>
          <p><strong>Ngày khám:</strong> {{ booking.form.appointmentDate || 'Chưa chọn' }}</p>
          <p><strong>Khung giờ:</strong> {{ selectedSlotLabel }}</p>
          <p><strong>Triệu chứng:</strong> {{ booking.form.clinicalSymptoms || 'Chưa nhập' }}</p>
        </article>
      </div>

      <p v-if="booking.error" class="msg err">{{ booking.error }}</p>
      <p v-if="booking.successMessage" class="msg ok">{{ booking.successMessage }}</p>

      <div class="actions">
        <button type="button" @click="booking.goBack" :disabled="booking.step === 1 || booking.submitting">Quay lại</button>
        <button v-if="booking.step < 4" type="button" @click="booking.goNext" :disabled="booking.loadingDoctors || booking.loadingSlots">Tiếp tục</button>
        <button v-else type="button" class="primary" @click="submit" :disabled="booking.submitting">
          {{ booking.submitting ? 'Đang tạo lịch...' : 'Xác nhận tạo lịch' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useBookingStore } from '../stores/booking.js';
import { guestApi } from '../services/api.js';

const route = useRoute();
const booking = useBookingStore();
const selectedServiceName = ref('');

const selectedSlotLabel = computed(() => {
  const slot = booking.availableSlots.find((item) => item.start === booking.form.slotStart);
  return slot?.label || 'Chưa chọn';
});

const emptySlotMessage = computed(() => {
  if (!booking.slotsChecked) {
    return 'Chưa có khung giờ. Hãy chọn ngày và bấm Kiểm tra giờ trống.';
  }
  return 'Không tìm thấy khung giờ trống cho ngày này. Vui lòng thử ngày khác.';
});

const selectedDoctorFromQuery = computed(() => {
  const doctorId = String(route.query.doctor || '').trim();
  if (!doctorId) return '';
  const doc = booking.doctors.find((item) => item.id === doctorId);
  return doc?.name || doctorId;
});

const onSpecialtyChange = (event) => {
  booking.setSpecialty(event.target.value);
};

const onDoctorChange = (event) => {
  booking.setDoctor(event.target.value);
};

const onDateInput = (event) => {
  booking.setDate(event.target.value);
};

const loadSlots = async () => {
  try {
    await booking.fetchAvailableSlots();
  } catch {
    // error is already stored in booking store
  }
};

const submit = async () => {
  try {
    await booking.submitAppointment();
  } catch {
    // error is already stored in booking store
  }
};

onMounted(async () => {
  booking.clearFeedback();
  await booking.initialize();

  const doctorFromQuery = String(route.query.doctor || '').trim();
  if (doctorFromQuery) {
    booking.setDoctor(doctorFromQuery);
  }

  const serviceFromQuery = String(route.query.service || '').trim();
  if (serviceFromQuery) {
    try {
      const publicInfo = await guestApi.publicInfo();
      const services = Array.isArray(publicInfo?.services) ? publicInfo.services : [];
      const matched = services.find((item) => String(item?.id || '').trim() === serviceFromQuery);
      selectedServiceName.value = matched?.name || serviceFromQuery;
      if (!booking.form.clinicalSymptoms.trim()) {
        booking.form.clinicalSymptoms = `Tư vấn và khám theo dịch vụ: ${selectedServiceName.value}.`;
      }
    } catch {
      selectedServiceName.value = serviceFromQuery;
    }
  }
});
</script>

<style scoped>
.booking-page {
  display: grid;
  gap: 20px;
}

.hero {
  background: linear-gradient(120deg, #eef2ff 0%, #f8fafc 100%);
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #3730a3;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 32px;
}

.hero p {
  margin: 10px 0 0;
  color: #334155;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 16px;
  align-items: start;
}

.context-chips {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.85);
  color: #334155;
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 6px 9px;
}

.hero-side {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 12px;
}

.hero-side-title {
  margin: 0 0 8px;
  font-weight: 700;
  color: #0f172a;
}

.hero-side p {
  margin: 0 0 6px;
}

.steps {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.steps li {
  color: #64748b;
}

.steps li.active {
  color: #111827;
  font-weight: 600;
}

.steps li.done {
  color: #047857;
}

.step-body {
  margin-top: 16px;
  display: grid;
  gap: 14px;
}

.step-body h2 {
  margin: 0;
}

.two-col {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.slot-controls {
  align-items: end;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #334155;
  font-size: 14px;
}

.row-end {
  align-content: end;
}

.action-field {
  align-content: end;
}

.action-field button {
  min-height: 44px;
  width: 100%;
}

.slot-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.slot-btn {
  min-height: 44px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.slot-btn.selected {
  border-color: #1d4ed8;
  background: #dbeafe;
}

.confirm-card {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  padding: 14px;
}

.confirm-card p {
  margin: 0 0 8px;
  color: #334155;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.primary {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.muted {
  margin: 0;
  color: #64748b;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
