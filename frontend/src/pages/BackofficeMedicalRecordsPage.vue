<template>
	<div class="page">
		<header class="panel">
			<h1>Medical Records</h1>
			<p>View records and add entries for patient charts.</p>
			<div class="row">
				<input v-if="auth.role === 'doctor'" v-model="patientId" placeholder="Patient ID" />
				<button type="button" @click="refresh">Refresh</button>
			</div>
		</header>

		<section class="panel">
			<h2>Entries</h2>
			<div v-if="records.list.length === 0">No records found.</div>
			<div class="list-grid">
				<article v-for="entry in records.list" :key="entry.id || entry.recordId" class="item">
					<p><strong>{{ entry.note || entry.description || 'Record entry' }}</strong></p>
					<p>Doctor: {{ entry.doctorId || 'N/A' }}</p>
					<p>Time: {{ entry.recordedAt || '-' }}</p>
				</article>
			</div>
		</section>

		<section v-if="auth.role === 'doctor'" class="panel">
			<h2>Add visit note</h2>
			<form class="grid two" @submit.prevent="addNote">
				<textarea v-model="note" required rows="4" placeholder="Visit note"></textarea>
				<button type="submit">Add entry</button>
			</form>
		</section>

		<p v-if="records.error" class="msg err">{{ records.error }}</p>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useRecordsStore } from '../stores/records.js';

const auth = useAuthStore();
const records = useRecordsStore();
const patientId = ref('');
const note = ref('');

const refresh = () => {
	const filters = auth.role === 'doctor' ? { patientId: patientId.value } : {};
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
