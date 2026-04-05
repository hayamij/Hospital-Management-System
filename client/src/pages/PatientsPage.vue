<template>
	<div class="page">
		<header class="panel workspace-header" :class="{ 'doctor-theme': isDoctor }">
			<div class="header-copy">
				<p v-if="isDoctor" class="eyebrow">DOCTOR PATIENTS</p>
				<h1>{{ isDoctor ? 'Theo dõi bệnh nhân' : 'Bệnh nhân' }}</h1>
				<p>
					{{
						isDoctor
							? 'Tra cứu bệnh án bệnh nhân và truy cập nhanh hồ sơ điều trị theo mã bệnh nhân.'
							: 'Hồ sơ bệnh nhân và truy cập bệnh án.'
					}}
				</p>
			</div>
			<div class="header-actions">
				<button type="button" @click="loadRecords">Làm mới</button>
			</div>
		</header>

		<section v-if="isDoctor" class="doctor-kpi-grid">
			<article class="panel kpi-card primary">
				<p class="kpi-label">Bản ghi hiện có</p>
				<p class="kpi-value">{{ patients.records.length }}</p>
				<p class="kpi-note">Tổng số bản ghi bệnh án đã tải.</p>
			</article>

			<article class="panel kpi-card waiting">
				<p class="kpi-label">Mã bệnh nhân đang xem</p>
				<p class="kpi-value code">{{ patientId || '--' }}</p>
				<p class="kpi-note">Nhập mã bệnh nhân để lọc hồ sơ chuyên biệt.</p>
			</article>
		</section>

		<section v-if="isPatient" class="panel">
			<div class="section-head">
				<h2>Cập nhật hồ sơ</h2>
				<small>Cập nhật nhanh thông tin cá nhân đang sử dụng</small>
			</div>
			<form class="grid two" @submit.prevent="updateProfile">
				<input v-model="profile.name" placeholder="Họ và tên" />
				<input v-model="profile.phone" placeholder="Số điện thoại" />
				<input v-model="profile.address" placeholder="Địa chỉ" />
				<input v-model="profile.dateOfBirth" type="date" />
				<input v-model="profile.emergencyContact" placeholder="Liên hệ khẩn cấp" />
				<button type="submit">Lưu hồ sơ</button>
			</form>
		</section>

		<section v-if="isDoctor" class="panel">
			<div class="section-head">
				<h2>Bệnh án bệnh nhân</h2>
				<small>Truy vấn theo mã bệnh nhân để mở đúng hồ sơ</small>
			</div>
			<div class="row">
				<input v-model="patientId" placeholder="Mã bệnh nhân" />
				<button type="button" @click="loadRecords">Tải bệnh án</button>
			</div>
			<div class="list-grid">
				<article v-for="rec in patients.records" :key="rec.id || rec.recordId" class="item doctor-item">
					<p><strong>{{ rec.note || 'Ghi chú' }}</strong></p>
					<p>{{ rec.recordedAt }} | Bác sĩ {{ rec.doctorName || rec.authorDoctorName || rec.doctorId || rec.authorDoctorId || '-' }}</p>
				</article>
			</div>
		</section>

		<p v-if="patients.error" class="msg err">{{ patients.error }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { usePatientsStore } from '../stores/patients.js';
import { useAuthStore } from '../stores/auth.js';
import { useRoleVisibility } from '../composables/useRoleVisibility.js';

const auth = useAuthStore();
const { isDoctor, isPatient } = useRoleVisibility(auth);
const patients = usePatientsStore();
const patientId = ref('');
const profile = reactive({ name: '', phone: '', address: '', dateOfBirth: '', emergencyContact: '' });

const updateProfile = async () => {
	await patients.updateProfile(profile);
};

const loadRecords = () => patients.loadRecords(patientId.value ? { patientId: patientId.value } : {});
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

.doctor-kpi-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14px;
}

.kpi-card {
	display: grid;
	gap: 8px;
	align-content: start;
}

.kpi-card.primary {
	background: linear-gradient(120deg, #eff6ff 0%, #eef2ff 100%);
}

.kpi-card.waiting {
	background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.kpi-label {
	margin: 0;
	color: #475569;
}

.kpi-value {
	margin: 0;
	font-size: 34px;
	line-height: 1.1;
	font-weight: 700;
	color: #0f172a;
}

.kpi-value.code {
	font-size: 24px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
}

.kpi-note {
	margin: 0;
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

.two { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.list-grid { margin-top: 14px; }

.doctor-item {
	border: 1px solid #dbe2ea;
	border-radius: 12px;
	background: #f8fafc;
	padding: 14px;
}

.doctor-item p {
	margin: 0 0 6px;
	color: #334155;
}

@media (max-width: 1100px) {
	.header-copy h1 {
		font-size: 28px;
	}

	.doctor-kpi-grid {
		grid-template-columns: 1fr;
	}
}
</style>
