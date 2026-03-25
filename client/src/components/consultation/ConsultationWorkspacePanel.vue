<template>
  <div class="consultation page">
    <header class="panel">
      <h1>Consultation Workspace</h1>
      <p>Khong gian nhap lieu ca kham voi bo cuc split view.</p>

      <div class="row controls">
        <input
          :value="patientIdInput"
          placeholder="Nhap Patient ID"
          @input="$emit('update:patientIdInput', $event.target.value)"
        />
        <button type="button" :disabled="recordsLoading" @click="$emit('load-records')">
          Tai ho so benh an
        </button>
      </div>
    </header>

    <section class="split-view">
      <article class="panel left-pane">
        <div class="pane-head">
          <h2>Ho so benh an cu</h2>
          <small v-if="activePatientId">Benh nhan: {{ activePatientId }}</small>
        </div>

        <p v-if="recordsLoading" class="muted">Dang tai ho so...</p>
        <p v-else-if="recordsError" class="msg err">{{ recordsError }}</p>
        <p v-else-if="recordRows.length === 0" class="muted">Chua co du lieu benh an cho benh nhan nay.</p>

        <DataTable
          v-else
          :columns="recordColumns"
          :rows="recordRows"
          row-key="id"
          empty-text="Khong co du lieu."
        >
          <template #cell-recordedAt="{ value }">{{ formatDateTime(value) }}</template>
          <template #cell-summary="{ row }">
            <button type="button" class="link-btn" @click="$emit('select-record', row)">Xem chi tiet</button>
          </template>
        </DataTable>

        <div v-if="selectedRecord" class="record-detail">
          <h3>Chi tiet ban ghi</h3>
          <p><strong>Thoi gian:</strong> {{ formatDateTime(selectedRecord.recordedAt) }}</p>
          <p><strong>Noi dung:</strong> {{ selectedRecord.note || selectedRecord.description || '-' }}</p>
          <p><strong>Bac si:</strong> {{ selectedRecord.doctorId || '-' }}</p>
        </div>
      </article>

      <article class="panel right-pane">
        <h2>Nhap lieu ca kham hien tai</h2>

        <form class="form-grid" @submit.prevent="$emit('submit')">
          <label class="field">
            <span>Ghi chu lam sang</span>
            <textarea
              v-model.trim="form.clinicalNote"
              rows="4"
              placeholder="Mo ta trieu chung, dau hieu sinh ton, danh gia ban dau..."
            ></textarea>
            <small v-if="submitted && errors.clinicalNote" class="field-error">{{ errors.clinicalNote }}</small>
          </label>

          <label class="field">
            <span>Chan doan ICD-10</span>
            <input v-model.trim="form.icd10" type="text" placeholder="Vi du: J20.9" />
            <small v-if="submitted && errors.icd10" class="field-error">{{ errors.icd10 }}</small>
          </label>

          <label class="field">
            <span>Ke don thuoc</span>
            <textarea
              v-model.trim="form.prescription"
              rows="4"
              placeholder="Ten thuoc, lieu dung, tan suat, so ngay..."
            ></textarea>
            <small v-if="submitted && errors.prescription" class="field-error">{{ errors.prescription }}</small>
          </label>

          <label class="field">
            <span>Chi dinh xet nghiem</span>
            <textarea
              v-model.trim="form.labOrders"
              rows="3"
              placeholder="Cong thuc mau, CRP, X-Quang phoi..."
            ></textarea>
            <small v-if="submitted && errors.labOrders" class="field-error">{{ errors.labOrders }}</small>
          </label>

          <div class="actions">
            <button type="submit" :disabled="submitting">{{ submitting ? 'Dang luu...' : 'Luu ca kham' }}</button>
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
