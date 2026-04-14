<template>
	<div class="page">
		<header class="panel workspace-header" :class="{ 'doctor-theme': isDoctor }">
			<div class="header-copy">
				<p v-if="isDoctor" class="eyebrow">MEDICAL RECORDS</p>
				<h1>Hồ sơ bệnh án</h1>
				<p>Xem hồ sơ và thêm ghi chú cho bệnh án theo quy trình vận hành backoffice.</p>
			</div>
			<div class="header-actions">
				<input v-if="isDoctor" v-model="patientId" placeholder="Mã bệnh nhân" />
				<button v-if="isDoctor" type="button" @click="createMedicalRecord" :disabled="records.loading">Tạo hồ sơ bệnh án</button>
				<button type="button" @click="refresh" :disabled="records.loading">Tìm kiếm</button>
			</div>
		</header>

		<section class="panel">
			<div class="section-head">
				<h2>Ghi chú</h2>
				<small>{{ records.list.length }} bản ghi hiện có</small>
			</div>
			<p v-if="isDoctor && !patientId.trim()" class="muted">
				Nhập mã bệnh nhân để tải hồ sơ bệnh án tương ứng.
			</p>
			<div v-if="records.list.length === 0">Chưa có hồ sơ.</div>
			<div class="list-grid">
				<article v-for="(entry, index) in records.list" :key="entry.id || entry.recordId || entry.createdAt || index" class="item record-item">
					<p><strong>{{ entry.note || entry.description || 'Ghi chú hồ sơ' }}</strong></p>
					<p>Bác sĩ: {{ entry.doctorName || entry.authorDoctorName || entry.doctorId || entry.authorDoctorId || 'N/A' }}</p>
					<p>Thời gian: {{ entry.recordedAt || entry.createdAt || '-' }}</p>
				</article>
			</div>
		</section>

		<section v-if="isDoctor" class="panel">
			<div class="section-head">
				<h2>Thêm ghi chú khám</h2>
				<small>Bổ sung thông tin điều trị vào hồ sơ đang theo dõi</small>
			</div>
			<form class="grid two" @submit.prevent="addNote">
				<textarea v-model="note" required rows="4" placeholder="Ghi chú khám"></textarea>
				<button type="submit">Thêm ghi chú</button>
			</form>
		</section>

		<p v-if="statusMessage" class="msg ok">{{ statusMessage }}</p>

		<p v-if="records.error" class="msg err">{{ records.error }}</p>
	</div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import { useRecordsStore } from '../../stores/records.js';
import { useRoleVisibility } from '../../composables/useRoleVisibility.js';
import {
	clearDoctorRecordsState,
	readDoctorRecordsState,
	writeDoctorRecordsState,
} from '../../services/sessionStorage.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const records = useRecordsStore();
const { isDoctor } = useRoleVisibility(auth);
const patientId = ref('');
const note = ref('');
const statusMessage = ref('');

const syncPatientQuery = (normalizedPatientId) => {
	const currentPatientId = String(route.query.patientId || '').trim();
	if (currentPatientId === normalizedPatientId) return;

	const nextQuery = { ...route.query };
	if (normalizedPatientId) {
		nextQuery.patientId = normalizedPatientId;
	} else {
		delete nextQuery.patientId;
	}

	router.replace({ query: nextQuery }).catch(() => {});
};

const persistPatientContext = (normalizedPatientId) => {
	if (!isDoctor.value) return;

	if (normalizedPatientId) {
		writeDoctorRecordsState({ patientId: normalizedPatientId });
	} else {
		clearDoctorRecordsState();
	}

	syncPatientQuery(normalizedPatientId);
};

const getInitialPatientId = () => {
	const queryPatientId = String(route.query.patientId || '').trim();
	if (queryPatientId) return queryPatientId;

	const cached = readDoctorRecordsState();
	return String(cached?.patientId || '').trim();
};

const ensureAuthContext = async () => {
	if (!auth.role && auth.token) {
		await auth.fetchCurrentUser();
	}
};

const refresh = async ({ showEmptyError = true, ensureRecordIfMissing = false } = {}) => {
	await ensureAuthContext();
	statusMessage.value = '';
	let normalizedPatientId = String(patientId.value || '').trim();
	if (isDoctor.value && !normalizedPatientId) {
		const fallbackPatientId = getInitialPatientId();
		if (fallbackPatientId) {
			normalizedPatientId = fallbackPatientId;
			patientId.value = fallbackPatientId;
		}
	}
	persistPatientContext(normalizedPatientId);

	if (isDoctor.value && !normalizedPatientId) {
		records.list = [];
		records.error = showEmptyError ? 'Vui lòng nhập mã bệnh nhân để tải hồ sơ.' : null;
		return null;
	}

	const filters = isDoctor.value ? { patientId: normalizedPatientId } : {};
	try {
		const response = await records.fetchRecords(filters);

		if (
			isDoctor.value &&
			normalizedPatientId &&
			ensureRecordIfMissing &&
			response &&
			response.hasRecord === false
		) {
			await records.createRecord(normalizedPatientId);
			statusMessage.value = `Đã tự động tạo hồ sơ bệnh án cho bệnh nhân ${normalizedPatientId}.`;
		}

		return response;
	} catch {
		return null;
	}
};

watch(patientId, (value) => {
	const normalizedPatientId = String(value || '').trim();
	persistPatientContext(normalizedPatientId);
	if (records.error && normalizedPatientId) {
		records.error = null;
	}
});

watch(
	() => route.query.patientId,
	(value) => {
		if (!isDoctor.value) return;
		const normalizedPatientId = String(value || '').trim();
		if (normalizedPatientId === String(patientId.value || '').trim()) return;
		patientId.value = normalizedPatientId;
	}
);

onMounted(async () => {
	await ensureAuthContext();

	if (!isDoctor.value) {
		await refresh({ showEmptyError: false });
		return;
	}

	const restoredPatientId = getInitialPatientId();
	if (!restoredPatientId) {
		records.error = null;
		records.list = [];
		return;
	}

	patientId.value = restoredPatientId;
	await refresh({ showEmptyError: false, ensureRecordIfMissing: true });
});

const createMedicalRecord = async () => {
	const normalizedPatientId = String(patientId.value || '').trim();
	persistPatientContext(normalizedPatientId);
	if (!normalizedPatientId) {
		records.error = 'Vui lòng nhập mã bệnh nhân trước khi tạo hồ sơ.';
		statusMessage.value = '';
		return;
	}

	let result;
	try {
		result = await records.createRecord(normalizedPatientId);
	} catch {
		statusMessage.value = '';
		return;
	}

	if (!result) {
		statusMessage.value = '';
		return;
	}

	statusMessage.value = result.created
		? `Đã tạo hồ sơ bệnh án cho bệnh nhân ${normalizedPatientId}.`
		: `Hồ sơ bệnh án của bệnh nhân ${normalizedPatientId} đã tồn tại.`;
};

const addNote = async () => {
	const normalizedPatientId = String(patientId.value || '').trim();
	persistPatientContext(normalizedPatientId);
	if (!normalizedPatientId) {
		records.error = 'Vui lòng nhập mã bệnh nhân trước khi thêm ghi chú.';
		return;
	}
	statusMessage.value = '';
	try {
		await records.addEntry(normalizedPatientId, note.value);
		note.value = '';
	} catch {
		// Error is already captured in records.error.
	}
};
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

.muted {
	margin: 0 0 10px;
	color: #64748b;
}

.two { grid-template-columns: 1fr auto; }

.record-item {
	border: 1px solid #dbe2ea;
	border-radius: 12px;
	background: #f8fafc;
	padding: 14px;
}

.record-item p {
	margin: 0 0 6px;
	color: #334155;
}

@media (max-width: 800px) { .two { grid-template-columns: 1fr; } }

@media (max-width: 1100px) {
	.header-copy h1 {
		font-size: 28px;
	}
}
</style>

