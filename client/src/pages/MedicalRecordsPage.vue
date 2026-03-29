<template>
	<div class="page">
		<header class="panel">
			<h1>Hồ sơ khám bệnh</h1>
			<p>Lịch sử kết quả khám và đơn thuốc của bạn được hiển thị dưới dạng bảng.</p>
			<button type="button" @click="refresh" :disabled="records.loading">Làm mới</button>
		</header>

		<section class="panel">
			<DataTable
				:columns="columns"
				:rows="rows"
				row-key="id"
				empty-text="Chưa có bản ghi khám bệnh nào."
			>
				<template #cell-visitDate="{ value }">{{ formatDate(value) }}</template>
				<template #cell-actions="{ row }">
					<div class="row actions">
						<button type="button" @click="viewDetail(row)">Xem chi tiết</button>
						<button type="button" @click="downloadPrescription(row)">Tải PDF</button>
					</div>
				</template>
			</DataTable>
		</section>

		<section v-if="selectedRecord" class="panel">
			<h2>Chi tiết kết quả khám</h2>
			<p><strong>Ngày khám:</strong> {{ formatDate(selectedRecord.visitDate) }}</p>
			<p><strong>Chẩn đoán:</strong> {{ selectedRecord.diagnosis || 'Đang cập nhật' }}</p>
			<p><strong>Bác sĩ:</strong> {{ selectedRecord.doctorName || selectedRecord.doctorId || 'Đang cập nhật' }}</p>
			<p><strong>Ghi chú:</strong> {{ selectedRecord.note || selectedRecord.description || 'Không có' }}</p>
		</section>

		<p v-if="records.error" class="msg err">{{ records.error }}</p>
	</div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRecordsStore } from '../stores/records.js';
import { useAuthStore } from '../stores/auth.js';
import { patientApi } from '../services/api.js';
import DataTable from '../components/shared/DataTable.vue';

const records = useRecordsStore();
const auth = useAuthStore();
const selectedRecord = ref(null);

const columns = [
	{ key: 'visitDate', label: 'Ngày khám', width: '160px' },
	{ key: 'diagnosis', label: 'Chẩn đoán' },
	{ key: 'doctor', label: 'Bác sĩ', width: '200px' },
	{ key: 'actions', label: 'Thao tác', width: '220px' },
];

const rows = computed(() => records.list.map((item, index) => ({
	id: item.id || item.recordId || `record-${index + 1}`,
	visitDate: item.visitDate || item.recordedAt || item.createdAt || null,
	diagnosis: item.diagnosis || item.title || item.note || 'Ket qua kham',
	doctor: item.doctorName || item.doctorId || 'Đang cập nhật',
	doctorName: item.doctorName,
	doctorId: item.doctorId,
	note: item.note,
	description: item.description,
}))); 

const refresh = () => {
	selectedRecord.value = null;
	return records.fetchRecords({});
};

onMounted(refresh);

const formatDate = (value) => {
	const d = new Date(value || '');
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});
};

const viewDetail = (row) => {
	selectedRecord.value = row;
};

const downloadPrescription = async (row) => {
	const id = row.id;
	if (!id) return;
	try {
		const response = await patientApi.downloadPrescription(auth.token, id);
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
		records.error = error?.message || 'Không thể tải đơn thuốc.';
	}
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
