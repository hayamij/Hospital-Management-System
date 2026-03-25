<template>
  <div class="consultation page">
    <header class="panel">
      <h1>Consultation Workspace</h1>
      <p>Khong gian nhap lieu ca kham voi bo cuc split view.</p>

      <div class="row controls">
        <input v-model.trim="patientIdInput" placeholder="Nhap Patient ID" />
        <button type="button" @click="loadPatientRecords" :disabled="records.loading">Tai ho so benh an</button>
      </div>
    </header>

    <section class="split-view">
      <article class="panel left-pane">
        <div class="pane-head">
          <h2>Ho so benh an cu</h2>
          <small v-if="activePatientId">Benh nhan: {{ activePatientId }}</small>
        </div>

        <p v-if="records.loading" class="muted">Dang tai ho so...</p>
        <p v-else-if="records.error" class="msg err">{{ records.error }}</p>
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
            <button type="button" class="link-btn" @click="selectRecord(row)">Xem chi tiet</button>
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

        <form class="form-grid" @submit.prevent="submitConsultation">
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
            <input
              v-model.trim="form.icd10"
              type="text"
              placeholder="Vi du: J20.9"
            />
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import DataTable from '../components/shared/DataTable.vue';
import { doctorApi } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useRecordsStore } from '../stores/records.js';

const route = useRoute();
const auth = useAuthStore();
const records = useRecordsStore();

const patientIdInput = ref('');
const activePatientId = ref('');
const selectedRecord = ref(null);
const submitting = ref(false);
const submitted = ref(false);
const success = ref('');
const submitError = ref('');

const form = reactive({
  clinicalNote: '',
  icd10: '',
  prescription: '',
  labOrders: '',
});

const recordColumns = [
  { key: 'recordedAt', label: 'Thoi gian', width: '170px' },
  { key: 'doctorId', label: 'Bac si', width: '120px' },
  { key: 'note', label: 'Ghi chu' },
  { key: 'summary', label: 'Chi tiet', width: '120px', align: 'center' },
];

const recordRows = computed(() => records.list.map((item, idx) => ({
  id: item.id || item.recordId || `record-${idx + 1}`,
  recordedAt: item.recordedAt || item.visitDate || item.createdAt || null,
  doctorId: item.doctorId || '-',
  note: item.note || item.description || item.diagnosis || '-',
  description: item.description || '',
}))); 

const icd10Regex = /^[A-TV-Z][0-9][0-9AB](\.[0-9A-TV-Z]{1,4})?$/i;

const errors = computed(() => {
  const e = {};

  if (!activePatientId.value) {
    e.patient = 'Vui long chon benh nhan truoc khi luu.';
  }

  if (!form.clinicalNote || form.clinicalNote.length < 10) {
    e.clinicalNote = 'Ghi chu lam sang can toi thieu 10 ky tu.';
  }

  if (!form.icd10 || !icd10Regex.test(form.icd10)) {
    e.icd10 = 'Ma ICD-10 khong hop le (vi du: J20.9).';
  }

  if (!form.prescription || form.prescription.length < 5) {
    e.prescription = 'Noi dung ke don thuoc can toi thieu 5 ky tu.';
  }

  if (!form.labOrders || form.labOrders.length < 3) {
    e.labOrders = 'Chi dinh xet nghiem can toi thieu 3 ky tu.';
  }

  return e;
});

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

const loadPatientRecords = async () => {
  const pid = patientIdInput.value.trim();
  if (!pid) return;

  activePatientId.value = pid;
  selectedRecord.value = null;
  success.value = '';
  submitError.value = '';
  await records.fetchRecords({ patientId: pid });
};

const selectRecord = (row) => {
  selectedRecord.value = row;
};

const submitConsultation = async () => {
  submitted.value = true;
  success.value = '';
  submitError.value = '';

  if (Object.keys(errors.value).length > 0) {
    submitError.value = errors.value.patient || 'Vui long kiem tra lai thong tin truoc khi luu.';
    return;
  }

  submitting.value = true;
  try {
    const noteBlock = [
      `Clinical: ${form.clinicalNote}`,
      `ICD10: ${form.icd10.toUpperCase()}`,
      `Prescription: ${form.prescription}`,
      `Lab Orders: ${form.labOrders}`,
    ].join('\n');

    await doctorApi.addVisitNote(auth.token, activePatientId.value, {
      doctorId: auth.userId,
      note: noteBlock,
    });

    const currentRecordId = selectedRecord.value?.id || records.list?.[0]?.id || records.list?.[0]?.recordId;
    if (currentRecordId) {
      await doctorApi.updateMedicalRecordEntry(auth.token, currentRecordId, {
        doctorId: auth.userId,
        note: noteBlock,
      });
    }

    success.value = 'Da luu thong tin ca kham hien tai thanh cong.';
    await records.fetchRecords({ patientId: activePatientId.value });
  } catch (error) {
    submitError.value = error?.message || 'Khong the luu ca kham. Vui long thu lai.';
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  auth.fetchCurrentUser();
  const pid = String(route.params.patientId || route.query.patientId || '').trim();
  if (pid) {
    patientIdInput.value = pid;
    await loadPatientRecords();
  }
});
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
