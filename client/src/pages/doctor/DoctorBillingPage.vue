<template>
	<div class="page">
		<header class="panel workspace-header">
			<div class="header-copy">
				<p class="eyebrow">DOCTOR BILLING</p>
				<h1>Hóa đơn bệnh nhân của bác sĩ</h1>
				<p>Theo dõi các hóa đơn đã tạo cho bệnh nhân được phân công và trạng thái thanh toán hiện tại.</p>
			</div>

			<div class="header-actions">
				<label class="field-inline">
					<span>Trạng thái</span>
					<select v-model="filters.status" @change="onStatusChange">
						<option value="">Tất cả</option>
						<option value="draft">Nháp</option>
						<option value="issued">Đã phát hành</option>
						<option value="paid">Đã thanh toán</option>
						<option value="void">Đã hủy</option>
					</select>
				</label>
				<button type="button" :disabled="billing.doctorBillingLoading" @click="handleRefresh">Làm mới</button>
			</div>
		</header>

		<section class="panel">
			<div class="section-head">
				<h2>Danh sách hóa đơn</h2>
				<small>{{ billing.doctorInvoices.length }} / {{ billing.doctorBillingTotal }} hóa đơn</small>
			</div>

			<p v-if="billing.doctorBillingLoading" class="muted">Đang tải hóa đơn...</p>
			<p v-else-if="billing.doctorBillingError" class="msg err">{{ billing.doctorBillingError }}</p>

			<DataTable
				v-else
				:columns="columns"
				:rows="rows"
				row-key="id"
				empty-text="Chưa có hóa đơn nào cho bệnh nhân của bạn."
			>
				<template #cell-status="{ value }">
					<span class="status-badge" :class="invoiceStatusBadgeClass(value)">{{ formatInvoiceStatus(value) }}</span>
				</template>
				<template #cell-amount="{ value }">{{ formatMoney(value) }}</template>
				<template #cell-dueDate="{ value }">{{ formatDate(value) }}</template>
				<template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
				<template #cell-charges="{ row }">
					<div class="charge-list">
						<p v-for="(line, idx) in row.charges" :key="`${row.id}-line-${idx}`">
							{{ line.description || line.serviceName || line.item || '-' }} - {{ formatMoney(line.amount) }}
							<span v-if="line.note" class="line-note">({{ line.note }})</span>
						</p>
					</div>
				</template>
			</DataTable>

			<div v-if="billing.doctorBillingTotal > billing.doctorBillingPageSize" class="pager">
				<button type="button" :disabled="billing.doctorBillingPage <= 1" @click="prevPage">Trước</button>
				<span>Trang {{ billing.doctorBillingPage }} / {{ totalPages }}</span>
				<button type="button" :disabled="billing.doctorBillingPage >= totalPages" @click="nextPage">Sau</button>
			</div>
		</section>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import DataTable from '../../components/shared/DataTable.vue';
import { useBillingStore } from '../../stores/billing.js';

const billing = useBillingStore();
const filters = reactive({ status: '' });

const columns = [
	{ key: 'invoiceNumber', label: 'Hóa đơn', width: '170px' },
	{ key: 'patientName', label: 'Bệnh nhân', width: '190px' },
	{ key: 'status', label: 'Trạng thái', width: '130px' },
	{ key: 'amount', label: 'Tổng tiền', width: '140px', align: 'right' },
	{ key: 'dueDate', label: 'Hạn thanh toán', width: '150px' },
	{ key: 'createdAt', label: 'Ngày tạo', width: '170px' },
	{ key: 'charges', label: 'Chi tiết dịch vụ' },
];

const rows = computed(() => {
	return billing.doctorInvoices.map((invoice, index) => ({
		id: invoice.id || invoice.invoiceId || `doctor-invoice-${index + 1}`,
		invoiceNumber: invoice.invoiceNumber || invoice.id || '-',
		patientName: invoice.patientName || invoice.patientId || '-',
		status: invoice.status || 'draft',
		amount: Number(invoice.amount ?? invoice.total ?? invoice.totalAmount ?? 0),
		dueDate: invoice.dueDate || null,
		createdAt: invoice.createdAt || null,
		charges: Array.isArray(invoice.charges) ? invoice.charges : [],
	}));
});

const totalPages = computed(() => {
	const pageSize = Number(billing.doctorBillingPageSize) || 10;
	const total = Number(billing.doctorBillingTotal) || 0;
	return Math.max(1, Math.ceil(total / pageSize));
});

const formatInvoiceStatus = (statusValue) => {
	const status = String(statusValue || '').toLowerCase();
	if (status === 'issued') return 'Đã phát hành';
	if (status === 'open') return 'Đang mở';
	if (status === 'draft') return 'Nháp';
	if (status === 'paid') return 'Đã thanh toán';
	if (status === 'overdue') return 'Quá hạn';
	if (status === 'void') return 'Đã hủy';
	return statusValue || '-';
};

const invoiceStatusBadgeClass = (statusValue) => {
	const status = String(statusValue || '').toLowerCase();
	if (status === 'paid') return 'is-ok';
	if (status === 'issued' || status === 'open') return 'is-info';
	if (status === 'draft') return 'is-neutral';
	if (status === 'overdue') return 'is-warn';
	if (status === 'void') return 'is-off';
	return 'is-neutral';
};

const formatMoney = (value) => {
	const amount = Number(value);
	if (Number.isNaN(amount)) return '-';
	return `${amount.toLocaleString('vi-VN')} VND`;
};

const formatDate = (value) => {
	const date = new Date(value || '');
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleDateString('vi-VN');
};

const formatDateTime = (value) => {
	const date = new Date(value || '');
	if (Number.isNaN(date.getTime())) return '-';
	return date.toLocaleString('vi-VN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const refresh = async ({ resetPage = false } = {}) => {
	if (resetPage) {
		billing.doctorBillingPage = 1;
	}

	await billing.fetchDoctorBilling({
		status: filters.status || undefined,
		page: billing.doctorBillingPage,
		pageSize: billing.doctorBillingPageSize,
	});
};

const onStatusChange = async () => {
	await refresh({ resetPage: true });
};

const handleRefresh = async () => {
	filters.status = '';
	billing.doctorBillingPage = 1;
	billing.doctorBillingPageSize = 10;
	await refresh();
};

const prevPage = async () => {
	if (billing.doctorBillingPage <= 1) return;
	billing.doctorBillingPage -= 1;
	await refresh();
};

const nextPage = async () => {
	if (billing.doctorBillingPage >= totalPages.value) return;
	billing.doctorBillingPage += 1;
	await refresh();
};

onMounted(() => {
	void refresh({ resetPage: true });
});
</script>

<style scoped>
.workspace-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 16px;
	flex-wrap: wrap;
}

.eyebrow {
	margin: 0;
	font-size: 12px;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #1d4ed8;
}

.header-copy h1 {
	margin: 8px 0 0;
	font-size: 34px;
}

.header-copy p {
	margin: 10px 0 0;
	color: #334155;
}

.header-actions {
	display: flex;
	align-items: end;
	gap: 10px;
	flex-wrap: wrap;
}

.field-inline {
	display: grid;
	gap: 8px;
	min-width: 220px;
}

.field-inline span {
	color: #334155;
	font-weight: 600;
}

.section-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	margin-bottom: 12px;
}

.section-head h2 {
	margin: 0;
}

.section-head small {
	color: #64748b;
}

.charge-list p {
	margin: 0 0 4px;
}

.line-note {
	color: #475569;
}

.status-badge {
	display: inline-flex;
	align-items: center;
	height: 26px;
	padding: 0 10px;
	border: 1px solid transparent;
	font-size: 12px;
	font-weight: 600;
}

.status-badge.is-ok {
	background: #ecfdf5;
	border-color: #86efac;
	color: #166534;
}

.status-badge.is-info {
	background: #eff6ff;
	border-color: #93c5fd;
	color: #1d4ed8;
}

.status-badge.is-neutral {
	background: #f8fafc;
	border-color: #cbd5e1;
	color: #334155;
}

.status-badge.is-warn {
	background: #fffbeb;
	border-color: #fcd34d;
	color: #92400e;
}

.status-badge.is-off {
	background: #fef2f2;
	border-color: #fca5a5;
	color: #991b1b;
}

.pager {
	margin-top: 14px;
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 10px;
}

.muted {
	margin: 0;
	color: #64748b;
}

@media (max-width: 1100px) {
	.header-copy h1 {
		font-size: 28px;
	}
}
</style>
