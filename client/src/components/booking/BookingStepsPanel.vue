<template>
  <section class="panel">
    <ol class="steps">
      <li :class="{ active: step === 1, done: step > 1 }">1. Chọn chuyên khoa/bác sĩ</li>
      <li :class="{ active: step === 2, done: step > 2 }">2. Chọn ngày và khung giờ</li>
      <li :class="{ active: step === 3, done: step > 3 }">3. Điền triệu chứng lâm sàng</li>
      <li :class="{ active: step === 4 }">4. Xác nhận và tạo cuộc hẹn</li>
    </ol>

    <div v-if="step === 1" class="step-body">
      <h2>Bước 1: Chọn chuyên khoa và bác sĩ</h2>
      <div class="grid two-col">
        <label class="field">
          <span>Chuyên khoa</span>
          <select :value="form.specialty" @change="$emit('specialty-change', $event.target.value)">
            <option value="">Chọn chuyên khoa</option>
            <option v-for="item in specialties" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>

        <label class="field">
          <span>Bác sĩ</span>
          <select :value="form.doctorId" @change="$emit('doctor-change', $event.target.value)">
            <option value="">Chọn bác sĩ</option>
            <option v-for="doc in filteredDoctors" :key="doc.id" :value="doc.id">
              {{ doc.name }} - {{ doc.specialty }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="step === 2" class="step-body">
      <h2>Bước 2: Chọn ngày và khung giờ</h2>
      <div class="grid two-col slot-controls">
        <label class="field">
          <span>Ngày khám</span>
          <input type="date" :value="form.appointmentDate" @input="$emit('date-input', $event.target.value)" />
        </label>
        <div class="field action-field">
          <span>&nbsp;</span>
          <button type="button" @click="$emit('load-slots')" :disabled="loadingSlots">
            {{ loadingSlots ? 'Đang kiểm tra...' : 'Kiểm tra giờ trống' }}
          </button>
        </div>
      </div>

      <p v-if="loadingSlots" class="muted">Đang tải khung giờ trống...</p>
      <p v-else-if="availableSlots.length === 0" class="muted">{{ emptySlotMessage }}</p>

      <div v-else class="slot-grid">
        <button
          v-for="slot in availableSlots"
          :key="slot.id"
          type="button"
          class="slot-btn"
          :class="{ selected: form.slotStart === slot.start }"
          @click="$emit('select-slot', slot)"
        >
          {{ slot.label }}
        </button>
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
        {{ submitting ? 'Đang tạo lịch...' : 'Xác nhận tạo lịch' }}
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  step: { type: Number, required: true },
  form: { type: Object, required: true },
  specialties: { type: Array, default: () => [] },
  filteredDoctors: { type: Array, default: () => [] },
  selectedDoctor: { type: Object, default: null },
  loadingDoctors: { type: Boolean, default: false },
  loadingSlots: { type: Boolean, default: false },
  availableSlots: { type: Array, default: () => [] },
  emptySlotMessage: { type: String, default: '' },
  selectedSlotLabel: { type: String, default: '' },
  error: { type: String, default: '' },
  successMessage: { type: String, default: '' },
  submitting: { type: Boolean, default: false },
});

defineEmits([
  'specialty-change',
  'doctor-change',
  'date-input',
  'load-slots',
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
</style>
