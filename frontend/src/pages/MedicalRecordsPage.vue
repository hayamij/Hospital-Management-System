<template>
	<div class="page">
		<header class="panel">
			<h1>Ho so kham benh</h1>
			<p>Lich su ket qua kham va don thuoc cua ban duoc hien thi duoi dang bang.</p>
			<button type="button" @click="refresh" :disabled="records.loading">Lam moi</button>
		</header>

		<section class="panel">
			<DataTable
				:columns="columns"
				:rows="rows"
				row-key="id"
				empty-text="Chua co ban ghi kham benh nao."
			>
				<template #cell-visitDate="{ value }">{{ formatDate(value) }}</template>
				<template #cell-actions="{ row }">
					<div class="row actions">
						<button type="button" @click="viewDetail(row)">Xem chi tiet</button>
						<button type="button" @click="downloadPrescription(row)">Tai PDF</button>
					</div>
				</template>
			</DataTable>
		</section>

		<section v-if="selectedRecord" class="panel">
			<h2>Chi tiet ket qua kham</h2>
			<p><strong>Ngay kham:</strong> {{ formatDate(selectedRecord.visitDate) }}</p>
			<p><strong>Chan doan:</strong> {{ selectedRecord.diagnosis || 'Dang cap nhat' }}</p>
			<p><strong>Bac si:</strong> {{ selectedRecord.doctorName || selectedRecord.doctorId || 'Dang cap nhat' }}</p>
			<p><strong>Ghi chu:</strong> {{ selectedRecord.note || selectedRecord.description || 'Khong co' }}</p>
		</section>

		<p v-if="records.error" class="msg err">{{ records.error }}</p>
	</div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRecordsStore } from '../stores/records.js';
import DataTable from '../components/shared/DataTable.vue';

const records = useRecordsStore();
const selectedRecord = ref(null);

const columns = [
	{ key: 'visitDate', label: 'Ngay kham', width: '160px' },
	{ key: 'diagnosis', label: 'Chan doan' },
	{ key: 'doctor', label: 'Bac si', width: '200px' },
	{ key: 'actions', label: 'Thao tac', width: '220px' },
];

const rows = computed(() => records.list.map((item, index) => ({
	id: item.id || item.recordId || `record-${index + 1}`,
	visitDate: item.visitDate || item.recordedAt || item.createdAt || null,
	diagnosis: item.diagnosis || item.title || item.note || 'Ket qua kham',
	doctor: item.doctorName || item.doctorId || 'Dang cap nhat',
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
	window.open(`/api/patients/prescriptions/${id}/download`, '_blank', 'noopener,noreferrer');
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
