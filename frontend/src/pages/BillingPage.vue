<template>
  <section class="page">
    <header class="page__header">
      <h1>Billing</h1>
      <small>Issue invoices, mark payments, download prescriptions</small>
    </header>

    <div class="panel two-col">
      <BillingForm
        v-model="invoiceForm"
        :last-invoice="lastInvoice"
        :loading="loading"
        @submit="onIssue"
        @mark="onMarkPaid"
        @void="onVoid"
      />
      <BillingTable :billing="billing" v-model:patientId="billingPatientId" @change="fetchBilling" />
    </div>

    <div class="panel two-col">
      <PrescriptionDownload v-model="prescriptionId" :link="prescriptionLink" :loading="loading" @submit="onDownload" />
      <ServiceList :services="services" />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import BillingForm from '../components/billing/BillingForm.vue';
import BillingTable from '../components/billing/BillingTable.vue';
import PrescriptionDownload from '../components/billing/PrescriptionDownload.vue';
import ServiceList from '../components/billing/ServiceList.vue';
import { useBillingStore } from '../stores/billing.js';
import { usePatientsStore } from '../stores/patients.js';

const billingStore = useBillingStore();
const patientsStore = usePatientsStore();

const invoiceForm = reactive({ id: '', patientId: 'pat-1', total: 0, dueDate: '' });
const billingPatientId = ref('pat-1');
const prescriptionId = ref('rx-1');
const lastInvoice = ref(null);
const prescriptionLink = ref(null);

const loading = computed(() => billingStore.loading);
const billing = computed(() => billingStore.items);
const services = computed(() => patientsStore.services);

const fetchBilling = async () => { await billingStore.viewBillingAndPayments(billingPatientId.value); };

const onIssue = async (payload) => {
  lastInvoice.value = await billingStore.manageBilling({ invoiceId: payload.id || 'new', action: 'issue', dueDate: payload.dueDate, patientId: payload.patientId });
};

const onMarkPaid = async (invoiceId) => {
  lastInvoice.value = await billingStore.manageBilling({ invoiceId, action: 'markPaid', patientId: billingPatientId.value });
};

const onVoid = async (invoiceId) => {
  lastInvoice.value = await billingStore.manageBilling({ invoiceId, action: 'void', patientId: billingPatientId.value });
};

const onDownload = async () => {
  prescriptionLink.value = await billingStore.downloadPrescription(prescriptionId.value, billingPatientId.value);
};

onMounted(async () => {
  await fetchBilling();
  await patientsStore.browsePublicInfo();
});

watch(billingPatientId, fetchBilling);
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

button.danger {
  background: #dc2626;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.list {
  display: grid;
  gap: 0.35rem;
  padding: 0;
  list-style: none;
}
</style>
