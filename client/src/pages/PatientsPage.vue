<template>
	<div class="page">
		<header class="panel">
			<h1>Bệnh nhân</h1>
			<p>Hồ sơ bệnh nhân và truy cập bệnh án.</p>
			<button type="button" @click="loadRecords">Làm mới</button>
		</header>

		<section v-if="auth.role === 'patient'" class="panel">
			<h2>Cập nhật hồ sơ</h2>
			<form class="grid two" @submit.prevent="updateProfile">
				<input v-model="profile.name" placeholder="Họ và tên" />
				<input v-model="profile.phone" placeholder="Số điện thoại" />
				<input v-model="profile.address" placeholder="Địa chỉ" />
				<input v-model="profile.dateOfBirth" type="date" />
				<input v-model="profile.emergencyContact" placeholder="Liên hệ khẩn cấp" />
				<button type="submit">Lưu hồ sơ</button>
			</form>
		</section>

		<section v-if="auth.role === 'doctor'" class="panel">
			<h2>Bệnh án bệnh nhân</h2>
			<div class="row">
				<input v-model="patientId" placeholder="Mã bệnh nhân" />
				<button type="button" @click="loadRecords">Tải bệnh án</button>
			</div>
			<div class="list-grid">
				<article v-for="rec in patients.records" :key="rec.id || rec.recordId" class="item">
					<p><strong>{{ rec.note || 'Ghi chú' }}</strong></p>
					<p>{{ rec.recordedAt }} | Bác sĩ {{ rec.doctorId || '-' }}</p>
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

const auth = useAuthStore();
const patients = usePatientsStore();
const patientId = ref('');
const profile = reactive({ name: '', phone: '', address: '', dateOfBirth: '', emergencyContact: '' });

const updateProfile = async () => {
	await patients.updateProfile(profile);
};

const loadRecords = () => {
	if (auth.role === 'doctor' && patientId.value) {
		return patients.loadRecords({ patientId: patientId.value });
	}
	if (auth.role === 'patient') {
		return patients.loadRecords();
	}
	return Promise.resolve();
};
</script>

<style scoped>
.two { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.list-grid { margin-top: 14px; }
</style>
