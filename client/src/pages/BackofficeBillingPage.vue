<template>
	<div class="page">
		<header class="panel">
			<h1>Thanh toán</h1>
			<p>Xem hồ sơ thanh toán và thực hiện tác vụ liên quan.</p>
			<button type="button" @click="refresh">Làm mới</button>
		</header>

		<div v-if="auth.role === 'patient'" class="panel">
			<h2>Hóa đơn</h2>
			<div v-if="billing.invoices.length === 0">Chưa có hóa đơn.</div>
			<div class="grid two-col">
				<div v-for="invoice in billing.invoices" :key="invoice.id || invoice.invoiceNumber" class="item">
					<p><strong>Hóa đơn {{ invoice.invoiceNumber || invoice.id }}</strong></p>
					<p>Trạng thái: {{ invoice.status }}</p>
					<p>Tổng tiền: {{ invoice.total || invoice.amount }}</p>
					<p>Hạn thanh toán: {{ invoice.dueDate || '-' }}</p>
				</div>
			</div>
		</div>

		<div v-if="auth.role === 'admin'" class="panel">
			<h2>Tác vụ thanh toán (admin)</h2>
			<form class="grid action-grid" @submit.prevent="handleAdminAction">
				<input v-model="adminForm.invoiceId" required placeholder="Mã hóa đơn" />
				<select v-model="adminForm.action" required>
					<option value="issue">Phát hành</option>
					<option value="markPaid">Đã thanh toán</option>
					<option value="void">Hủy</option>
				</select>
				<input v-model="adminForm.dueDate" type="date" />
				<button type="submit">Áp dụng</button>
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
