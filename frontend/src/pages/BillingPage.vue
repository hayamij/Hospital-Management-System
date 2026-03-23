<template>
	<div class="page">
		<header class="panel">
			<h1>Billing</h1>
			<p>View billing records and execute billing actions.</p>
			<button type="button" @click="refresh">Refresh</button>
		</header>

		<div v-if="auth.role === 'patient'" class="panel">
			<h2>Invoices</h2>
			<div v-if="billing.invoices.length === 0">No invoices yet.</div>
			<div class="grid two-col">
				<div v-for="invoice in billing.invoices" :key="invoice.id || invoice.invoiceNumber" class="item">
					<p><strong>Invoice {{ invoice.invoiceNumber || invoice.id }}</strong></p>
					<p>Status: {{ invoice.status }}</p>
					<p>Total: {{ invoice.total || invoice.amount }}</p>
					<p>Due: {{ invoice.dueDate || '-' }}</p>
				</div>
			</div>
		</div>

		<div v-if="auth.role === 'admin'" class="panel">
			<h2>Admin billing actions</h2>
			<form class="grid action-grid" @submit.prevent="handleAdminAction">
				<input v-model="adminForm.invoiceId" required placeholder="Invoice ID" />
				<select v-model="adminForm.action" required>
					<option value="issue">Issue</option>
					<option value="markPaid">Mark paid</option>
					<option value="void">Void</option>
				</select>
				<input v-model="adminForm.dueDate" type="date" />
				<button type="submit">Apply</button>
			</form>
		</div>

		<p v-if="billing.error" class="msg err">{{ billing.error }}</p>
	</div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useBillingStore } from '../stores/billing.js';

const auth = useAuthStore();
const billing = useBillingStore();

const adminForm = reactive({ invoiceId: '', action: 'issue', dueDate: '' });

const refresh = () => {
	if (auth.role === 'patient') {
		billing.fetchBilling();
	}
};

onMounted(refresh);

const handleAdminAction = async () => {
	await billing.manageInvoice(adminForm.invoiceId, { action: adminForm.action, dueDate: adminForm.dueDate });
	Object.assign(adminForm, { invoiceId: '', action: 'issue', dueDate: '' });
};
</script>

<style scoped>
.two-col { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.action-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
</style>
