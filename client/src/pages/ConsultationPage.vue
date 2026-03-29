<template>
  <ConsultationWorkspacePanel
    v-model:patientIdInput="patientIdInput"
    :active-patient-id="activePatientId"
    :records-loading="records.loading"
    :records-error="records.error"
    :record-rows="recordRows"
    :record-columns="recordColumns"
    :selected-record="selectedRecord"
    :form="form"
    :submitted="submitted"
    :errors="errors"
    :submitting="submitting"
    :success="success"
    :submit-error="submitError"
    :format-date-time="formatDateTime"
    @load-records="loadPatientRecords"
    @select-record="selectRecord"
    @submit="submitConsultation"
  />
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import ConsultationWorkspacePanel from '../components/consultation/ConsultationWorkspacePanel.vue';
import { doctorApi } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useRecordsStore } from '../stores/records.js';
import {
  buildConsultationErrors,
  buildConsultationNoteBlock,
  formatDateTime,
  mapRecordRows,
} from './controllers/consultationController.js';

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
  { key: 'recordedAt', label: 'Thời gian', width: '170px' },
  { key: 'doctorId', label: 'Bác sĩ', width: '120px' },
  { key: 'note', label: 'Ghi chú' },
  { key: 'summary', label: 'Chi tiết', width: '120px', align: 'center' },
];

const recordRows = computed(() => mapRecordRows(records.list));

const errors = computed(() => {
  return buildConsultationErrors({
    activePatientId: activePatientId.value,
    form,
  });
});

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
    submitError.value = errors.value.patient || 'Vui lòng kiểm tra lại thông tin trước khi lưu.';
    return;
  }

  submitting.value = true;
  try {
    const noteBlock = buildConsultationNoteBlock(form);

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

    success.value = 'Đã lưu thông tin ca khám hiện tại thành công.';
    await records.fetchRecords({ patientId: activePatientId.value });
  } catch (error) {
    submitError.value = error?.message || 'Không thể lưu ca khám. Vui lòng thử lại.';
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
