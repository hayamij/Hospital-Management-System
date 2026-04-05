<template>
  <section class="panel">
    <ol class="steps">
      <li :class="{ active: step === 1, done: step > 1 }">1. Chọn ngày và khung giờ</li>
      <li :class="{ active: step === 2, done: step > 2 }">2. Chọn bác sĩ trống giờ đó</li>
      <li :class="{ active: step === 3, done: step > 3 }">3. Điền triệu chứng lâm sàng</li>
      <li :class="{ active: step === 4 }">4. Xác nhận và tạo cuộc hẹn</li>
    </ol>

    <div v-if="step === 1" class="step-body">
      <h2>Bước 1: Chọn ngày khám và khung giờ</h2>
      <p v-if="selectedServiceName" class="muted service-hint">
        Dịch vụ đã chọn: <strong>{{ selectedServiceName }}</strong>
      </p>

      <div class="grid three-col slot-controls">
        <label class="field">
          <span>Lọc theo chuyên khoa (tùy chọn)</span>
          <select :value="form.specialty" @change="$emit('specialty-change', $event.target.value)">
            <option value="">Tất cả chuyên khoa</option>
            <option v-for="item in specialties" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="field">
          <span>Lọc theo bác sĩ (tên hoặc mã)</span>
          <input
            type="text"
            :value="form.doctorFilter"
            placeholder="Ví dụ: Nguyen Van A hoặc doc-1"
            @input="$emit('doctor-filter-change', $event.target.value)"
          />
        </label>

        <label class="field">
          <span>Ngày khám</span>
          <input type="date" :value="form.appointmentDate" @input="$emit('date-input', $event.target.value)" />
        </label>
      </div>

      <p v-if="loadingSlots" class="muted">Đang tự động tải khung giờ trống...</p>
      <p v-else-if="availableSlots.length === 0" class="muted">{{ emptySlotMessage }}</p>

      <div v-else class="slot-grid">
        <button
          v-for="slot in pagedSlots"
          :key="slot.id"
          type="button"
          class="slot-btn"
          :class="{ selected: form.slotStart === slot.start && form.slotEnd === slot.end }"
          @click="$emit('select-slot', slot)"
        >
          <strong>{{ slot.timeLabel || slot.label }}</strong>
          <small class="slot-meta">{{ slot.doctorNamesDisplay || 'Không có bác sĩ khả dụng' }}</small>
          <small v-if="slot.specialties?.length" class="slot-meta">{{ slot.specialtiesDisplay || slot.specialties.join(', ') }}</small>
        </button>
      </div>

      <div v-if="slotPageCount > 1" class="pager" role="navigation" aria-label="Phân trang khung giờ">
        <button type="button" class="pager-btn" :disabled="slotPage <= 1" @click="prevSlotPage">←</button>
        <span>Trang {{ slotPage }} / {{ slotPageCount }}</span>
        <button type="button" class="pager-btn" :disabled="slotPage >= slotPageCount" @click="nextSlotPage">→</button>
      </div>
    </div>

    <div v-if="step === 2" class="step-body">
      <h2>Bước 2: Chọn bác sĩ cho khung giờ đã chọn</h2>
      <p class="muted" v-if="selectedSlotLabel">
        Khung giờ đang chọn: <strong>{{ selectedSlotLabel }}</strong>
      </p>

      <p v-if="!form.slotStart || !form.slotEnd" class="muted">
        Bạn chưa chọn khung giờ. Vui lòng quay lại bước 1.
      </p>

      <p v-else-if="availableDoctorsForSelectedTime.length === 0" class="muted">
        Không có bác sĩ trống cho khung giờ này. Hãy quay lại và chọn giờ khác.
      </p>

      <div v-else class="doctor-grid">
        <button
          v-for="doc in pagedDoctors"
          :key="doc.id"
          type="button"
          class="doctor-btn"
          :class="{ selected: form.doctorId === doc.id }"
          @click="$emit('doctor-change', doc.id)"
        >
          <strong>{{ doc.name }}</strong>
          <small>{{ doc.specialty }}</small>
        </button>
      </div>

      <div v-if="doctorPageCount > 1" class="pager" role="navigation" aria-label="Phân trang bác sĩ">
        <button type="button" class="pager-btn" :disabled="doctorPage <= 1" @click="prevDoctorPage">←</button>
        <span>Trang {{ doctorPage }} / {{ doctorPageCount }}</span>
        <button type="button" class="pager-btn" :disabled="doctorPage >= doctorPageCount" @click="nextDoctorPage">→</button>
      </div>
    </div>

    <div v-if="step === 3" class="step-body">
      <h2>Bước 3: Triệu chứng lâm sàng</h2>
      <label class="field">
        <span>Mô tả triệu chứng</span>
        <textarea
          :value="form.clinicalSymptoms"
          rows="5"
          placeholder="Nhập triệu chứng, thời gian khởi phát và tiền sử liên quan..."
          @input="$emit('clinical-symptoms-input', $event.target.value)"
        ></textarea>
      </label>
    </div>

    <div v-if="step === 4" class="step-body">
      <h2>Bước 4: Xác nhận thông tin</h2>
      <article class="confirm-card">
        <p><strong>Dịch vụ:</strong> {{ selectedServiceName || 'Chưa xác định' }}</p>
        <p><strong>Chuyên khoa:</strong> {{ form.specialty || 'Chưa chọn' }}</p>
        <p><strong>Bác sĩ:</strong> {{ selectedDoctor?.name || 'Chưa chọn' }}</p>
        <p><strong>Ngày khám:</strong> {{ form.appointmentDate || 'Chưa chọn' }}</p>
        <p><strong>Khung giờ:</strong> {{ selectedSlotLabel }}</p>
        <p><strong>Triệu chứng:</strong> {{ form.clinicalSymptoms || 'Chưa nhập' }}</p>
      </article>
    </div>

    <p v-if="error" class="msg err">{{ error }}</p>
    <p v-if="successMessage" class="msg ok">{{ successMessage }}</p>

    <div class="actions">
      <button type="button" @click="$emit('go-back')" :disabled="step === 1 || submitting">Quay lại</button>
      <button v-if="step < 4" type="button" @click="$emit('go-next')" :disabled="loadingDoctors || loadingSlots">Tiếp tục</button>
      <button v-else type="button" class="primary" @click="$emit('submit')" :disabled="submitting">
        {{ submitting ? 'Dang xu ly...' : submitLabel }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const SLOT_PAGE_SIZE = 18;
const DOCTOR_PAGE_SIZE = 10;

const props = defineProps({
  step: { type: Number, required: true },
  form: { type: Object, required: true },
  selectedServiceName: { type: String, default: '' },
  specialties: { type: Array, default: () => [] },
  availableDoctorsForSelectedTime: { type: Array, default: () => [] },
  selectedDoctor: { type: Object, default: null },
  loadingDoctors: { type: Boolean, default: false },
  loadingSlots: { type: Boolean, default: false },
  availableSlots: { type: Array, default: () => [] },
  emptySlotMessage: { type: String, default: '' },
  selectedSlotLabel: { type: String, default: '' },
  error: { type: String, default: '' },
  successMessage: { type: String, default: '' },
  submitLabel: { type: String, default: 'Xac nhan tao lich' },
  submitting: { type: Boolean, default: false },
});

const slotPage = ref(1);
const doctorPage = ref(1);

const slotPageCount = computed(() => Math.max(1, Math.ceil(props.availableSlots.length / SLOT_PAGE_SIZE)));
const doctorPageCount = computed(() => Math.max(1, Math.ceil(props.availableDoctorsForSelectedTime.length / DOCTOR_PAGE_SIZE)));

const pagedSlots = computed(() => {
  const start = (slotPage.value - 1) * SLOT_PAGE_SIZE;
  return props.availableSlots.slice(start, start + SLOT_PAGE_SIZE);
});

const pagedDoctors = computed(() => {
  const start = (doctorPage.value - 1) * DOCTOR_PAGE_SIZE;
  return props.availableDoctorsForSelectedTime.slice(start, start + DOCTOR_PAGE_SIZE);
});

const prevSlotPage = () => {
  slotPage.value = Math.max(1, slotPage.value - 1);
};

const nextSlotPage = () => {
  slotPage.value = Math.min(slotPageCount.value, slotPage.value + 1);
};

const prevDoctorPage = () => {
  doctorPage.value = Math.max(1, doctorPage.value - 1);
};

const nextDoctorPage = () => {
  doctorPage.value = Math.min(doctorPageCount.value, doctorPage.value + 1);
};

watch(
  () => props.availableSlots.length,
  () => {
    slotPage.value = 1;
  }
);

watch(slotPageCount, (count) => {
  if (slotPage.value > count) {
    slotPage.value = count;
  }
});

watch(
  () => [props.form.slotStart, props.form.slotEnd, props.form.doctorId, props.availableSlots.length],
  () => {
    if (!props.form.slotStart || !props.form.slotEnd) return;
    const selectedIndex = props.availableSlots.findIndex(
      (slot) =>
        slot.start === props.form.slotStart &&
        slot.end === props.form.slotEnd
    );
    if (selectedIndex >= 0) {
      slotPage.value = Math.floor(selectedIndex / SLOT_PAGE_SIZE) + 1;
    }
  }
);

watch(
  () => props.availableDoctorsForSelectedTime.length,
  () => {
    doctorPage.value = 1;
  }
);

watch(doctorPageCount, (count) => {
  if (doctorPage.value > count) {
    doctorPage.value = count;
  }
});

watch(
  () => [props.form.doctorId, props.availableDoctorsForSelectedTime.length],
  () => {
    if (!props.form.doctorId) return;
    const selectedIndex = props.availableDoctorsForSelectedTime.findIndex(
      (doc) => doc.id === props.form.doctorId
    );
    if (selectedIndex >= 0) {
      doctorPage.value = Math.floor(selectedIndex / DOCTOR_PAGE_SIZE) + 1;
    }
  }
);

defineEmits([
  'specialty-change',
  'doctor-filter-change',
  'doctor-change',
  'date-input',
  'select-slot',
  'clinical-symptoms-input',
  'go-back',
  'go-next',
  'submit',
]);
</script>

<style scoped>
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

.three-col {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.slot-controls {
  align-items: end;
}

.service-hint {
  margin-bottom: 0;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #334155;
  font-size: 14px;
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
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: stretch;
}

.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.pager-btn {
  min-width: 40px;
  min-height: 40px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.slot-btn {
  min-height: 96px;
  max-height: 96px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  display: grid;
  grid-template-rows: 22px 18px 18px;
  gap: 4px;
  text-align: left;
  align-items: start;
  padding: 8px 10px;
  overflow: hidden;
}

.slot-btn strong {
  font-size: 13px;
  width: 100%;
  white-space: nowrap;
  text-align: center;
  font-variant-numeric: tabular-nums;
  line-height: 22px;
}

.slot-meta {
  display: block;
  width: 100%;
  color: #334155;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot-btn.selected {
  border-color: #1d4ed8;
  background: #dbeafe;
}

.doctor-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: stretch;
}

.doctor-btn {
  min-height: 72px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  display: grid;
  grid-template-rows: minmax(20px, auto) minmax(20px, auto);
  gap: 6px;
  text-align: left;
  align-items: start;
  padding: 10px 12px;
}

.doctor-btn strong {
  font-size: 14px;
  display: block;
  width: 100%;
  line-height: 1.3;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.doctor-btn small {
  display: block;
  width: 100%;
  color: #334155;
  line-height: 1.3;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.doctor-btn.selected {
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

@media (max-width: 1400px) {
  .doctor-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1120px) {
  .doctor-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .doctor-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .doctor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
