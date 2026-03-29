<template>
	<div class="page">
		<header class="panel">
			<h1>Hóa đơn của tôi</h1>
			<p>Danh sách hóa đơn và đơn thuốc liên quan được hiển thị dưới dạng bảng.</p>
			<button type="button" @click="refresh" :disabled="billing.loading">Làm mới</button>
		</header>

		<section class="panel">
			<DataTable
				:columns="columns"
				:rows="rows"
				row-key="id"
				empty-text="Bạn chưa có hóa đơn nào."
			>
				<template #cell-amount="{ value }">{{ formatMoney(value) }}</template>
				<template #cell-dueDate="{ value }">{{ formatDate(value) }}</template>
				<template #cell-actions="{ row }">
					<div class="row actions">
						<button type="button" @click="viewDetail(row)">Xem chi tiết</button>
						<button type="button" @click="downloadInvoice(row)">Tải PDF</button>
					</div>
				</template>
			</DataTable>
		</section>

		<section v-if="selectedInvoice" class="panel">
			<h2>Chi tiết hóa đơn</h2>
			<p><strong>Mã hóa đơn:</strong> {{ selectedInvoice.invoiceNumber || selectedInvoice.id }}</p>
			<p><strong>Trạng thái:</strong> {{ selectedInvoice.status || 'N/A' }}</p>
			<p><strong>Số tiền:</strong> {{ formatMoney(selectedInvoice.amount) }}</p>
			<p><strong>Hạn thanh toán:</strong> {{ formatDate(selectedInvoice.dueDate) }}</p>
		</section>

		<p v-if="billing.error" class="msg err">{{ billing.error }}</p>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useBillingStore } from '../stores/billing.js';
import { useAuthStore } from '../stores/auth.js';
import { patientApi } from '../services/api.js';
import DataTable from '../components/shared/DataTable.vue';

const billing = useBillingStore();
const auth = useAuthStore();
const selectedInvoice = ref(null);

const columns = [
	{ key: 'invoiceNumber', label: 'Mã hóa đơn', width: '170px' },
	{ key: 'status', label: 'Trạng thái', width: '140px' },
	{ key: 'amount', label: 'Tổng tiền', width: '160px', align: 'right' },
	{ key: 'dueDate', label: 'Hạn thanh toán', width: '150px' },
	{ key: 'actions', label: 'Thao tác', width: '220px' },
];

const rows = computed(() => billing.invoices.map((item, index) => ({
	id: item.id || item.invoiceId || `invoice-${index + 1}`,
	invoiceNumber: item.invoiceNumber || item.code || item.id || `INV-${index + 1}`,
	status: item.status || 'pending',
	amount: item.amount ?? item.total ?? item.totalAmount ?? 0,
	dueDate: item.dueDate || item.issuedAt || item.createdAt || null,
}))); 

const refresh = async () => {
	selectedInvoice.value = null;
	await billing.fetchBilling({});
};

onMounted(refresh);

const viewDetail = (row) => {
	selectedInvoice.value = row;
};

const downloadInvoice = async (row) => {
	const id = row.id;
	if (!id) return;
	try {
		const response = await patientApi.downloadInvoice(auth.token, id);
		const content = typeof response?.file === 'string' ? response.file : JSON.stringify(response?.file ?? {}, null, 2);
		const filename = response?.filename || `${id}.json`;
		const contentType = response?.contentType || 'application/json';

		const blob = new Blob([content], { type: contentType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		billing.error = error?.message || 'Không thể tải hóa đơn.';
	}
};

const formatDate = (value) => {
	const d = new Date(value || '');
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});
};

const formatMoney = (value) => {
	const n = Number(value);
	if (Number.isNaN(n)) return '-';
	return n.toLocaleString('vi-VN') + ' VND';
};
</script>

<style scoped>
.actions {
	gap: 8px;
}

.actions button {
	min-width: 100px;
}
</style>
