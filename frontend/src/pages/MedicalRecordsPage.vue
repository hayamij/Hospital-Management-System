<template>
  <section class="page">
    <header class="page__header">
      <h1>Medical Records</h1>
      <small>View, note, test results, audit</small>
    </header>

    <div class="panel two-col">
      <RecordsList :records="records" v-model:patientId="patientId" @change="fetchRecords" />
      <div class="stack">
        <VisitNoteForm v-model="noteForm" :loading="loading" @submit="onAddNote" />
        <TestResultForm v-model="testForm" :loading="loading" @submit="onTestResult" />
      </div>
    </div>

    <AuditPanel v-model="auditRecordId" :audit-result="auditResult" :loading="loading" @submit="onAudit" />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import AuditPanel from '../components/records/AuditPanel.vue';
import RecordsList from '../components/records/RecordsList.vue';
import TestResultForm from '../components/records/TestResultForm.vue';
import VisitNoteForm from '../components/records/VisitNoteForm.vue';
import { useRecordsStore } from '../stores/records.js';

const store = useRecordsStore();
const patientId = ref('pat-1');
const noteForm = reactive({ patientId: 'pat-1', recordId: '', note: '' });
const testForm = reactive({ labResultId: '', doctorId: '', result: '' });
const auditRecordId = ref('');
const auditResult = ref('');

const loading = computed(() => store.loading);
const records = computed(() => store.records);

const fetchRecords = async () => { await store.viewMedicalRecords(patientId.value); };

const onAddNote = async (payload) => {
  if (payload.recordId) {
    await store.updateMedicalRecordEntry(payload.recordId, payload.note);
  } else {
    await store.addVisitNote(payload.patientId, payload.note);
  }
  await fetchRecords();
};

const onTestResult = async (payload) => {
  await store.reviewTestResults(payload.labResultId, payload.result, payload.doctorId);
};

const onAudit = async (recordId) => {
  const data = await store.auditMedicalRecords(recordId, { action: 'view' });
  auditResult.value = JSON.stringify(data, null, 2);
};

watch(patientId, fetchRecords, { immediate: true });
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.form {
  display: grid;
  gap: 0.5rem;
}

.form--inline {
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  align-items: center;
  gap: 0.5rem;
}

input,
textarea,
button {
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
}

button {
  background: #2563eb;
  color: #fff;
  border: none;
  cursor: pointer;
}

.list {
  display: grid;
  gap: 0.6rem;
  padding: 0;
  list-style: none;
}

.audit {
  margin-top: 0.5rem;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 6px;
  white-space: pre-wrap;
}
.stack { display: grid; gap: 1rem; }
</style>
