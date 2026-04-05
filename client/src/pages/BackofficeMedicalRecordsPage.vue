<template>
	<div class="page">
		<header class="panel">
			<h1>Hồ sơ bệnh án</h1>
			<p>Xem hồ sơ và thêm ghi chú cho bệnh án.</p>
			<div class="row">
				<input v-if="isDoctor" v-model="patientId" placeholder="Mã bệnh nhân" />
				<button type="button" @click="refresh">Làm mới</button>
			</div>
		</header>

		<section class="panel">
			<h2>Ghi chú</h2>
			<div v-if="records.list.length === 0">Chưa có hồ sơ.</div>
			<div class="list-grid">
				<article v-for="entry in records.list" :key="entry.id || entry.recordId" class="item">
					<p><strong>{{ entry.note || entry.description || 'Ghi chú hồ sơ' }}</strong></p>
					<p>Bác sĩ: {{ entry.doctorId || 'N/A' }}</p>
					<p>Thời gian: {{ entry.recordedAt || '-' }}</p>
				</article>
			</div>
		</section>

		<section v-if="isDoctor" class="panel">
			<h2>Thêm ghi chú khám</h2>
			<form class="grid two" @submit.prevent="addNote">
				<textarea v-model="note" required rows="4" placeholder="Ghi chú khám"></textarea>
				<button type="submit">Thêm ghi chú</button>
			</form>
		</section>

		<p v-if="records.error" class="msg err">{{ records.error }}</p>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useRecordsStore } from '../stores/records.js';
import { useRoleVisibility } from '../composables/useRoleVisibility.js';

const auth = useAuthStore();
const records = useRecordsStore();
const { isDoctor } = useRoleVisibility(auth);
const patientId = ref('');
const note = ref('');

const refresh = () => {
	const filters = isDoctor.value ? { patientId: patientId.value } : {};
	return records.fetchRecords(filters);
};

onMounted(refresh);

const addNote = async () => {
	if (!patientId.value) return;
	await records.addEntry(patientId.value, note.value);
	note.value = '';
};
</script>

<style scoped>
.two { grid-template-columns: 1fr auto; }
@media (max-width: 800px) { .two { grid-template-columns: 1fr; } }
</style>
