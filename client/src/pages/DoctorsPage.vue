<template>
	<div class="page">
		<header class="panel">
			<h1>Bác sĩ</h1>
			<p>Tìm bác sĩ theo từ khóa và chuyên khoa.</p>
			<form class="search" @submit.prevent="search">
				<input v-model="filters.query" placeholder="Tên hoặc từ khóa" />
				<input v-model="filters.specialty" placeholder="Chuyên khoa" />
				<button type="submit">Tìm kiếm</button>
				<button type="button" @click="search">Làm mới</button>
			</form>
		</header>

		<section class="panel">
			<h2>Danh sách bác sĩ</h2>
			<p v-if="doctors.loading">Đang tải...</p>
			<p v-if="!doctors.loading && doctors.list.length === 0">Chưa có bác sĩ phù hợp.</p>
			<div class="grid two-col">
				<article v-for="doc in doctors.list" :key="doc.id || doc.doctorId" class="item">
					<p><strong>{{ doc.fullName || doc.name }}</strong></p>
					<p>{{ doc.specialization || doc.specialty }}</p>
					<p>Trạng thái: {{ doc.status || 'đang hoạt động' }}</p>
				</article>
			</div>
		</section>

		<section v-if="auth.role === 'admin'" class="panel">
			<h2>Quản lý danh mục dịch vụ (admin)</h2>
			<form class="grid admin-grid" @submit.prevent="upsertService">
				<input v-model="service.id" placeholder="Mã dịch vụ" />
				<input v-model="service.name" placeholder="Tên dịch vụ" required />
				<input v-model.number="service.price" type="number" min="0" placeholder="Giá" required />
				<button type="submit">Cập nhật dịch vụ</button>
			</form>
			<form class="row" @submit.prevent="removeService">
				<input v-model="removeServiceId" placeholder="Mã dịch vụ cần xóa" required />
				<button type="submit">Xóa dịch vụ</button>
			</form>
		</section>

		<p v-if="status" class="msg ok">{{ status }}</p>
		<p v-if="doctors.error" class="msg err">{{ doctors.error }}</p>
	</div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue';
import { useDoctorsStore } from '../stores/doctors.js';
import { useAuthStore } from '../stores/auth.js';

const doctors = useDoctorsStore();
const auth = useAuthStore();
const filters = reactive({ query: '', specialty: '' });
const service = reactive({ id: '', name: '', price: 0 });
const removeServiceId = ref('');
const status = ref('');

const search = () => doctors.search(filters);

const upsertService = async () => {
  status.value = '';
  await doctors.upsertService({ ...service });
	status.value = 'Cập nhật dịch vụ thành công.';
};

const removeService = async () => {
  status.value = '';
  await doctors.removeService(removeServiceId.value);
	status.value = 'Xóa dịch vụ thành công.';
};

onMounted(search);
</script>

<style scoped>
.search { display: grid; gap: 14px; grid-template-columns: 1fr 1fr auto auto; }
.two-col { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.admin-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.row { margin-top: 14px; }
@media (max-width: 900px) { .search { grid-template-columns: 1fr; } }
</style>
