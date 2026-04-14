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
				<template #cell-status="{ value }">
					<span class="status-chip" :class="statusClass(value)">{{ statusLabel(value) }}</span>
				</template>
				<template #cell-actions="{ row }">
					<div class="row actions">
						<button type="button" @click="viewDetail(row)">Xem chi tiết</button>
						<button type="button" @click="downloadInvoice(row)">Tải hóa đơn</button>
						<button
							v-if="canPay(row)"
							type="button"
							class="pay-btn"
							@click="openTransferModal(row)"
						>
							Chuyển khoản QR
						</button>
					</div>
				</template>
			</DataTable>
		</section>

		<section v-if="selectedInvoice" class="panel">
			<h2>Chi tiết hóa đơn</h2>
			<p><strong>Mã hóa đơn:</strong> {{ selectedInvoice.invoiceNumber || selectedInvoice.id }}</p>
			<p><strong>Trạng thái:</strong> {{ statusLabel(selectedInvoice.status || 'N/A') }}</p>
			<p><strong>Số tiền:</strong> {{ formatMoney(resolveInvoiceAmount(selectedInvoice)) }}</p>
			<p><strong>Hạn thanh toán:</strong> {{ formatDate(selectedInvoice.dueDate) }}</p>
			<p><strong>Số lần thanh toán đã ghi nhận:</strong> {{ selectedInvoicePaymentCount }}</p>
		</section>

		<section class="panel">
			<h2>Lịch sử thanh toán</h2>
			<DataTable
				:columns="paymentColumns"
				:rows="paymentRows"
				row-key="id"
				empty-text="Chưa có giao dịch thanh toán nào."
			>
				<template #cell-amount="{ value }">{{ formatMoney(value) }}</template>
				<template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
				<template #cell-status="{ value }">
					<span class="status-chip" :class="statusClass(value)">{{ statusLabel(value) }}</span>
				</template>
			</DataTable>
		</section>

		<div v-if="transferModalOpen" class="transfer-modal-backdrop" @click.self="closeTransferModal">
			<section class="panel transfer-modal">
				<div class="transfer-head">
					<div>
						<h2>Thanh toán chuyển khoản QR</h2>
						<p>
							Hóa đơn: <strong>{{ transferInvoice?.invoiceNumber || transferInvoice?.id }}</strong>
						</p>
					</div>
					<button type="button" @click="closeTransferModal">Đóng</button>
				</div>

				<div class="transfer-grid">
					<figure class="qr-box">
						<img :src="TRANSFER_QR_IMAGE" alt="QR code chuyển khoản" />
						<figcaption>Quét QR để chuyển khoản, sau đó gửi mã tham chiếu để bác sĩ xác nhận.</figcaption>
					</figure>

					<form class="transfer-form" @submit.prevent="submitTransfer">
						<label>
							<span>Số tiền</span>
							<input
								type="number"
								step="1000"
								min="1000"
								v-model="transferForm.amount"
								required
							/>
						</label>
						<label>
							<span>Mã tham chiếu giao dịch</span>
							<input
								type="text"
								maxlength="32"
								v-model="transferForm.transferReference"
								placeholder="VD: CTK123456"
								required
							/>
						</label>
						<label>
							<span>Ghi chú</span>
							<textarea
								v-model="transferForm.note"
								placeholder="Nội dung bổ sung (không bắt buộc)"
							></textarea>
						</label>

						<div class="row actions">
							<button type="submit" class="pay-btn" :disabled="billing.submittingTransfer">
								{{ billing.submittingTransfer ? 'Đang gửi...' : 'Gửi xác nhận chuyển khoản' }}
							</button>
							<button type="button" @click="closeTransferModal" :disabled="billing.submittingTransfer">
								Hủy
							</button>
						</div>
					</form>
				</div>
			</section>
		</div>

		<p v-if="transferMessage" class="msg ok">{{ transferMessage }}</p>

		<p v-if="billing.error" class="msg err">{{ billing.error }}</p>
	</div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useBillingStore } from '../../stores/billing.js';
import { useAuthStore } from '../../stores/auth.js';
import { patientApi } from '../../services/api.js';
import DataTable from '../../components/shared/DataTable.vue';

const billing = useBillingStore();
const auth = useAuthStore();
const selectedInvoice = ref(null);
const transferModalOpen = ref(false);
const transferInvoice = ref(null);
const transferMessage = ref('');
const transferForm = ref({
	amount: '',
	transferReference: '',
	note: '',
});
const BILLING_REFRESH_INTERVAL_MS = 30_000;
const TRANSFER_QR_IMAGE = '/assets/payment/QR_code.jpg';
let billingRefreshTimer = null;

const NON_PAYABLE_INVOICE_STATUSES = new Set(['paid', 'void']);

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const statusLabel = (value) => {
	const status = normalizeStatus(value);
	if (status === 'pending_confirmation') return 'Chờ bác sĩ xác nhận';
	if (status === 'completed') return 'Đã xác nhận';
	if (status === 'rejected') return 'Bị từ chối';
	if (status === 'paid') return 'Đã thanh toán';
	if (status === 'void') return 'Đã hủy';
	if (status === 'issued' || status === 'open') return 'Đang mở';
	if (status === 'draft') return 'Nháp';
	if (status === 'partial') return 'Thanh toán một phần';
	if (status === 'initiated') return 'Khởi tạo';
	return value || 'N/A';
};

const statusClass = (value) => {
	const status = normalizeStatus(value);
	if (status === 'completed' || status === 'paid') return 'ok';
	if (status === 'pending_confirmation' || status === 'initiated' || status === 'partial') return 'warn';
	if (status === 'rejected' || status === 'void' || status === 'failed') return 'err';
	return '';
};

const resolveInvoiceAmount = (invoice) => {
	const amount = Number(invoice?.amount ?? invoice?.total ?? invoice?.totalAmount ?? 0);
	if (Number.isFinite(amount) && amount > 0) return amount;

	const charges = Array.isArray(invoice?.charges) ? invoice.charges : [];
	return charges.reduce((sum, line) => sum + (Number(line?.amount) || 0), 0);
};

const canPay = (row) => !NON_PAYABLE_INVOICE_STATUSES.has(normalizeStatus(row?.status));

const findInvoiceById = (invoiceId) => {
	return billing.invoices.find((item) => String(item?.id ?? item?.invoiceId ?? '') === String(invoiceId));
};

const buildTransferReference = (invoice) => {
	const invoiceToken = String(invoice?.invoiceNumber || invoice?.id || 'INV')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase()
		.slice(-10);
	const timeToken = new Date()
		.toISOString()
		.replace(/[^0-9]/g, '')
		.slice(2, 12);

	return `CK${invoiceToken}${timeToken}`.slice(0, 32);
};

const columns = [
	{ key: 'invoiceNumber', label: 'Mã hóa đơn', width: '170px' },
	{ key: 'status', label: 'Trạng thái', width: '140px' },
	{ key: 'amount', label: 'Tổng tiền', width: '160px', align: 'right' },
	{ key: 'dueDate', label: 'Hạn thanh toán', width: '150px' },
	{ key: 'actions', label: 'Thao tác', width: '360px' },
];

const paymentColumns = [
	{ key: 'invoiceNumber', label: 'Mã hóa đơn', width: '160px' },
	{ key: 'status', label: 'Trạng thái', width: '170px' },
	{ key: 'amount', label: 'Số tiền', width: '160px', align: 'right' },
	{ key: 'method', label: 'Phương thức', width: '150px' },
	{ key: 'transferReference', label: 'Mã tham chiếu', width: '180px' },
	{ key: 'createdAt', label: 'Thời gian', width: '190px' },
];

const rows = computed(() => billing.invoices.map((item, index) => ({
	id: item.id || item.invoiceId || `invoice-${index + 1}`,
	invoiceNumber: item.invoiceNumber || item.code || item.id || `INV-${index + 1}`,
	status: item.status || 'pending',
	amount: resolveInvoiceAmount(item),
	dueDate: item.dueDate || item.issuedAt || item.createdAt || null,
}))); 

const paymentRows = computed(() => billing.payments.map((item, index) => ({
	id: item.id || `payment-${index + 1}`,
	invoiceId: item.invoiceId || null,
	invoiceNumber: item.invoiceNumber || item.invoiceId || '-',
	status: item.status || 'initiated',
	amount: Number(item.amount) || 0,
	method: item.method || 'bank_transfer',
	transferReference: item.transferReference || '-',
	createdAt: item.createdAt || null,
}))); 

const selectedInvoicePaymentCount = computed(() => {
	if (!selectedInvoice.value?.id) return 0;
	return paymentRows.value.filter((item) => String(item.invoiceId || '') === String(selectedInvoice.value.id)).length;
});

const refresh = async ({ resetSelection = true } = {}) => {
	if (billing.loading) return;
	if (resetSelection) {
		selectedInvoice.value = null;
	}
	await billing.fetchBilling({});
};

onMounted(() => {
	void refresh();
	billingRefreshTimer = setInterval(() => {
		void refresh({ resetSelection: false });
	}, BILLING_REFRESH_INTERVAL_MS);
});

onUnmounted(() => {
	if (billingRefreshTimer) {
		clearInterval(billingRefreshTimer);
		billingRefreshTimer = null;
	}
});

const viewDetail = (row) => {
	selectedInvoice.value = findInvoiceById(row.id) || row;
};

const openTransferModal = (row) => {
	const invoice = findInvoiceById(row.id) || row;
	transferInvoice.value = invoice;
	transferForm.value = {
		amount: String(resolveInvoiceAmount(invoice)),
		transferReference: buildTransferReference(invoice),
		note: '',
	};
	transferMessage.value = '';
	transferModalOpen.value = true;
};

const closeTransferModal = () => {
	transferModalOpen.value = false;
	transferInvoice.value = null;
};

const submitTransfer = async () => {
	if (!transferInvoice.value?.id) return;
	transferMessage.value = '';

	try {
		const result = await billing.submitTransferPayment(transferInvoice.value.id, {
			amount: Number(transferForm.value.amount),
			transferReference: transferForm.value.transferReference,
			note: transferForm.value.note,
			method: 'bank_transfer',
		});

		const ref = result?.transferReference ? ` (mã: ${result.transferReference})` : '';
		transferMessage.value = `Đã gửi yêu cầu xác nhận chuyển khoản${ref}.`;
		closeTransferModal();
	} catch (error) {
		billing.error = error?.message || 'Không thể gửi xác nhận chuyển khoản.';
	}
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

.pay-btn {
	background: #dbeafe;
	border-color: #2563eb;
	color: #1e3a8a;
	font-weight: 600;
}

.status-chip {
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border: 1px solid #cbd5e1;
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	background: #f8fafc;
}

.status-chip.ok {
	background: #dcfce7;
	border-color: #86efac;
	color: #166534;
}

.status-chip.warn {
	background: #fef9c3;
	border-color: #fde68a;
	color: #854d0e;
}

.status-chip.err {
	background: #fee2e2;
	border-color: #fecaca;
	color: #991b1b;
}

.transfer-modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.4);
	z-index: 50;
	display: grid;
	align-items: center;
	justify-items: center;
	padding: 24px;
}

.transfer-modal {
	width: min(940px, 100%);
	max-height: calc(100vh - 60px);
	overflow: auto;
	margin: 0;
}

.transfer-head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 14px;
	margin-bottom: 14px;
}

.transfer-head p {
	margin: 8px 0 0;
	color: #334155;
}

.transfer-grid {
	display: grid;
	grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
	gap: 20px;
	align-items: start;
}

.qr-box {
	margin: 0;
	padding: 16px;
	border: 1px solid #cbd5e1;
	background: #f8fafc;
	display: grid;
	gap: 10px;
}

.qr-box img {
	width: 100%;
	height: auto;
	object-fit: contain;
	border: 1px solid #cbd5e1;
	background: #fff;
}

.qr-box figcaption {
	margin: 0;
	font-size: 13px;
	color: #475569;
	line-height: 1.45;
}

.transfer-form {
	display: grid;
	gap: 12px;
}

.transfer-form label {
	display: grid;
	gap: 8px;
	font-weight: 600;
	color: #334155;
}

@media (max-width: 900px) {
	.transfer-grid {
		grid-template-columns: 1fr;
	}

	.transfer-modal {
		padding: 18px;
	}
}
</style>

