<template>
  <div class="consultation page">
    <header class="panel">
      <h1>Không gian khám bệnh</h1>
      <p>Không gian nhập liệu ca khám với bố cục chia đôi.</p>

      <div class="row controls">
        <input
          :value="patientIdInput"
          placeholder="Nhập mã bệnh nhân"
          @input="$emit('update:patientIdInput', $event.target.value)"
        />
        <button type="button" :disabled="recordsLoading" @click="$emit('load-records')">
          Tải hồ sơ bệnh án
        </button>
      </div>
    </header>

    <section class="split-view">
      <article class="panel left-pane">
        <div class="pane-head">
          <h2>Hồ sơ bệnh án cũ</h2>
          <small v-if="activePatientId">Bệnh nhân: {{ activePatientId }}</small>
        </div>

        <p v-if="recordsLoading" class="muted">Đang tải hồ sơ...</p>
        <p v-else-if="recordsError" class="msg err">{{ recordsError }}</p>
        <p v-else-if="recordRows.length === 0" class="muted">Chưa có dữ liệu bệnh án cho bệnh nhân này.</p>

        <DataTable
          v-else
          :columns="recordColumns"
          :rows="recordRows"
          row-key="id"
          empty-text="Không có dữ liệu."
        >
          <template #cell-recordedAt="{ value }">{{ formatDateTime(value) }}</template>
          <template #cell-summary="{ row }">
            <button type="button" class="link-btn" @click="$emit('select-record', row)">Xem chi tiết</button>
          </template>
        </DataTable>

        <div v-if="selectedRecord" class="record-detail">
          <h3>Chi tiết bản ghi</h3>
          <p><strong>Thời gian:</strong> {{ formatDateTime(selectedRecord.recordedAt) }}</p>
          <p><strong>Nội dung:</strong> {{ selectedRecord.note || selectedRecord.description || '-' }}</p>
          <p><strong>Bác sĩ:</strong> {{ selectedRecord.doctorId || '-' }}</p>
        </div>
      </article>

      <article class="panel right-pane">
        <h2>Nhập liệu ca khám hiện tại</h2>

        <form class="form-grid" @submit.prevent="$emit('submit')">
          <label class="field">
            <span>Ghi chú lâm sàng</span>
            <textarea
              v-model.trim="form.clinicalNote"
              rows="4"
              placeholder="Mô tả triệu chứng, dấu hiệu sinh tồn, đánh giá ban đầu..."
            ></textarea>
            <small v-if="submitted && errors.clinicalNote" class="field-error">{{ errors.clinicalNote }}</small>
          </label>

          <label class="field">
            <span>Chẩn đoán ICD-10</span>
            <input v-model.trim="form.icd10" type="text" placeholder="Ví dụ: J20.9" />
            <small v-if="submitted && errors.icd10" class="field-error">{{ errors.icd10 }}</small>
          </label>

          <label class="field">
            <span>Kê đơn thuốc</span>
            <textarea
              v-model.trim="form.prescription"
              rows="4"
              placeholder="Tên thuốc, liều dùng, tần suất, số ngày..."
            ></textarea>
            <small v-if="submitted && errors.prescription" class="field-error">{{ errors.prescription }}</small>
          </label>

          <label class="field">
            <span>Chỉ định xét nghiệm</span>
            <textarea
              v-model.trim="form.labOrders"
              rows="3"
              placeholder="Công thức máu, CRP, X-quang phổi..."
            ></textarea>
            <small v-if="submitted && errors.labOrders" class="field-error">{{ errors.labOrders }}</small>
          </label>

          <div class="actions">
            <button type="submit" :disabled="submitting">{{ submitting ? 'Đang lưu...' : 'Lưu ca khám' }}</button>
          </div>
        </form>

        <p v-if="success" class="msg ok">{{ success }}</p>
        <p v-if="submitError" class="msg err">{{ submitError }}</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import DataTable from '../shared/DataTable.vue';

defineProps({
  patientIdInput: { type: String, required: true },
  activePatientId: { type: String, required: true },
  recordsLoading: { type: Boolean, required: true },
  recordsError: { type: String, default: '' },
  recordRows: { type: Array, required: true },
  recordColumns: { type: Array, required: true },
  selectedRecord: { type: Object, default: null },
  form: { type: Object, required: true },
  submitted: { type: Boolean, required: true },
  errors: { type: Object, required: true },
  submitting: { type: Boolean, required: true },
  success: { type: String, default: '' },
  submitError: { type: String, default: '' },
  formatDateTime: { type: Function, required: true },
});

defineEmits(['update:patientIdInput', 'load-records', 'select-record', 'submit']);
</script>

<style scoped>
.controls {
  margin-top: 12px;
}

.split-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.pane-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.pane-head h2 {
  margin: 0;
}

.left-pane,
.right-pane {
  min-height: 560px;
}

.record-detail {
  margin-top: 14px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  padding: 12px;
}

.record-detail h3 {
  margin: 0 0 8px;
}

.record-detail p {
  margin: 0 0 6px;
}

.form-grid {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #334155;
  font-weight: 600;
}

.field-error {
  color: #b91c1c;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-start;
}

.link-btn {
  min-height: 34px;
  height: 34px;
  padding: 4px 10px;
  border: 1px solid #9ca3af;
  background: #f8fafc;
}

.muted {
  margin: 0;
  color: #64748b;
}

@media (max-width: 1200px) {
  .split-view {
    grid-template-columns: 1fr;
  }

  .left-pane,
  .right-pane {
    min-height: auto;
  }
}
</style>
