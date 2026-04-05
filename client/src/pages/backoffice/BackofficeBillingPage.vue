<template>
	<div class="page">
		<header class="panel">
			<h1>{{ isAdmin ? 'Tài chính hệ thống' : 'Thanh toán' }}</h1>
			<p>{{ isAdmin ? 'Theo dõi hóa đơn toàn hệ thống và xử lý trạng thái thanh toán.' : 'Xem hồ sơ thanh toán và thực hiện tác vụ liên quan.' }}</p>
			<button type="button" :disabled="billing.loading" @click="handleRefresh">Làm mới</button>
		</header>

		<div v-if="isPatient" class="panel">
			<h2>Hóa đơn</h2>
			<div v-if="billing.invoices.length === 0">Chưa có hóa đơn.</div>
			<div class="grid two-col">
				<div v-for="invoice in billing.invoices" :key="invoice.id || invoice.invoiceNumber" class="item">
					<p><strong>Hóa đơn {{ invoice.invoiceNumber || invoice.id }}</strong></p>
					<p>Trạng thái: <span class="status-badge" :class="invoiceStatusBadgeClass(invoice.status)">{{ formatInvoiceStatus(invoice.status) }}</span></p>
					<p>Tổng tiền: {{ invoice.total || invoice.amount }}</p>
					<p>Hạn thanh toán: {{ invoice.dueDate || '-' }}</p>
				</div>
			</div>
		</div>

		<div v-if="isAdmin" class="panel">
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

			<div class="toolbar status-toolbar">
				<label class="field-inline">
					<span>Trạng thái</span>
					<select v-model="filters.status" @change="onStatusChange">
						<option value="">Tất cả</option>
						<option value="draft">Nháp</option>
						<option value="issued">Đã phát hành</option>
						<option value="paid">Đã thanh toán</option>
						<option value="overdue">Quá hạn</option>
						<option value="void">Đã hủy</option>
					</select>
				</label>
				<span class="muted">{{ billing.invoices.length }} / {{ billing.total }} hóa đơn</span>
			</div>

			<div v-if="billing.invoices.length === 0">Chưa có dữ liệu hóa đơn.</div>
			<div v-else class="grid two-col invoice-grid">
				<div v-for="invoice in billing.invoices" :key="invoice.id || invoice.invoiceNumber" class="item">
					<p><strong>Hóa đơn {{ invoice.invoiceNumber || invoice.id }}</strong></p>
					<p>Mã bệnh nhân: {{ invoice.patientId || '-' }}</p>
					<p>Trạng thái: <span class="status-badge" :class="invoiceStatusBadgeClass(invoice.status)">{{ formatInvoiceStatus(invoice.status) }}</span></p>
					<p>Tổng tiền: {{ invoice.total || invoice.amount || 0 }}</p>
					<p>Hạn thanh toán: {{ invoice.dueDate || '-' }}</p>
					<button type="button" class="choose-invoice-btn" @click="adminForm.invoiceId = invoice.id || invoice.invoiceNumber">Chọn hóa đơn này</button>
				</div>
			</div>

			<div class="pager" v-if="billing.total > billing.pageSize">
				<button type="button" :disabled="billing.page <= 1" @click="prevPage">Trước</button>
				<span>Trang {{ billing.page }} / {{ totalPages }}</span>
				<button type="button" :disabled="billing.page >= totalPages" @click="nextPage">Sau</button>
			</div>
		</div>

		<p v-if="billing.error" class="msg err">{{ billing.error }}</p>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useBillingStore } from '../../stores/billing.js';
import { useRoleVisibility } from '../../composables/useRoleVisibility.js';

const auth = useAuthStore();
const billing = useBillingStore();
const { isAdmin, isPatient } = useRoleVisibility(auth);

const adminForm = reactive({ invoiceId: '', action: 'issue', dueDate: '' });
const filters = reactive({ status: '' });
const totalPages = computed(() => Math.max(1, Math.ceil((billing.total || 0) / (billing.pageSize || 10))));

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

const refresh = async ({ resetPage = false } = {}) => {
	if (resetPage) {
		billing.page = 1;
	}
	await billing.fetchBilling({ page: billing.page, pageSize: billing.pageSize, status: filters.status || undefined });
};

const onStatusChange = async () => {
	await refresh({ resetPage: true });
};

const handleRefresh = async () => {
	if (isAdmin.value) {
		filters.status = '';
		billing.page = 1;
		billing.pageSize = 10;
		await refresh();
		return;
	}

	await refresh({ resetPage: true });
};

const prevPage = async () => {
	if (billing.page <= 1) return;
	billing.page -= 1;
	await refresh();
};

const nextPage = async () => {
	if (billing.page >= totalPages.value) return;
	billing.page += 1;
	await refresh();
};

onMounted(() => {
	refresh();
});

const handleAdminAction = async () => {
	await billing.manageInvoice(adminForm.invoiceId, { action: adminForm.action, dueDate: adminForm.dueDate });
	Object.assign(adminForm, { invoiceId: '', action: 'issue', dueDate: '' });
	await refresh();
};
</script>

<style scoped>
.two-col { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.action-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }

.toolbar {
	margin-top: 14px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}

.status-toolbar {
	margin-top: 10px;
	gap: 6px;
}

.field-inline {
	display: flex;
	align-items: center;
	gap: 6px;
}

.muted {
	color: #64748b;
}

.invoice-grid {
	margin-top: 8px;
	gap: 8px;
}

.choose-invoice-btn {
	margin-top: 6px;
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
</style>

