<template>
	<div class="page">
		<header class="panel">
			<h1>Bác sĩ</h1>
			<p>Tìm bác sĩ theo từ khóa và chuyên khoa.</p>
			<form class="search" @submit.prevent="search">
				<input v-model="filters.query" placeholder="Tên hoặc từ khóa" />
				<input v-model="filters.specialty" placeholder="Chuyên khoa" />
				<button type="submit">Tìm kiếm</button>
				<button type="button" @click="handleRefreshSearch">Làm mới</button>
			</form>
		</header>

		<section class="panel">
			<h2>Danh sách bác sĩ</h2>
			<p v-if="doctors.loading">Đang tải...</p>
			<p v-if="!doctors.loading && doctors.list.length === 0">Chưa có bác sĩ phù hợp.</p>
			<SlidingPager
				v-if="!doctors.loading && doctors.list.length > 0"
				:items="doctors.list"
				:items-per-page="3"
				:mobile-items-per-page="1"
			>
				<template #default="{ item: doc }">
					<article class="item">
						<p><strong>{{ doc.fullName || doc.name }}</strong></p>
						<p>{{ doc.specialization || doc.specialty }}</p>
						<p>Trạng thái: {{ doc.status || 'đang hoạt động' }}</p>
					</article>
				</template>
			</SlidingPager>
		</section>

		<section class="panel all-doctors-panel">
			<div class="all-doctors-head">
				<h2>Danh sách tất cả bác sĩ</h2>
				<button type="button" class="toggle-btn" @click="toggleAllDoctors">
					{{ showAllDoctors ? 'Ẩn danh sách' : 'Hiện danh sách' }}
				</button>
			</div>
			<p class="all-doctors-hint">Bấm vào nút để mở danh sách đầy đủ dạng card.</p>

			<p v-if="showAllDoctors && allDoctorsLoading">Đang tải danh sách đầy đủ...</p>
			<p v-if="showAllDoctors && allDoctorsError" class="msg err">{{ allDoctorsError }}</p>
			<p v-if="showAllDoctors && !allDoctorsLoading && !allDoctorsError && allDoctors.length === 0">
				Chưa có bác sĩ để hiển thị.
			</p>

			<SlidingPager
				v-if="showAllDoctors && !allDoctorsLoading && allDoctors.length > 0"
				:items="allDoctors"
				:items-per-page="3"
				:mobile-items-per-page="1"
			>
				<template #default="{ item: doc }">
					<article class="item all-doctor-card">
						<p><strong>{{ doc.fullName || doc.name }}</strong></p>
						<p>{{ doc.specialization || doc.specialty || 'Chuyên khoa chung' }}</p>
						<p>Trạng thái: {{ doc.status || 'đang hoạt động' }}</p>
					</article>
				</template>
			</SlidingPager>
		</section>

		<section v-if="isAdmin" class="panel">
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
import SlidingPager from '../components/shared/SlidingPager.vue';
import { useRoleVisibility } from '../composables/useRoleVisibility.js';
import {
	mapDoctorsSearchResult,
	searchDoctorsByAuth,
} from '../stores/helpers/doctorsSearchApi.js';

const doctors = useDoctorsStore();
const auth = useAuthStore();
const { isAdmin } = useRoleVisibility(auth);
const filters = reactive({ query: '', specialty: '' });
const service = reactive({ id: '', name: '', price: 0 });
const removeServiceId = ref('');
const status = ref('');
const showAllDoctors = ref(false);
const allDoctors = ref([]);
const allDoctorsLoading = ref(false);
const allDoctorsError = ref('');

const search = () => doctors.search(filters);

const handleRefreshSearch = () => {
	filters.query = '';
	filters.specialty = '';
	search();
};

const loadAllDoctors = async () => {
	if (allDoctorsLoading.value) return;

	allDoctorsLoading.value = true;
	allDoctorsError.value = '';

	try {
		const response = await searchDoctorsByAuth({
			isAuthenticated: auth.isAuthenticated,
			filters: { query: '', specialty: '' },
		});
		allDoctors.value = mapDoctorsSearchResult(response).list;
	} catch (error) {
		allDoctorsError.value = error?.message || 'Không thể tải danh sách tất cả bác sĩ.';
	} finally {
		allDoctorsLoading.value = false;
	}
};

const toggleAllDoctors = async () => {
	showAllDoctors.value = !showAllDoctors.value;

	if (showAllDoctors.value && allDoctors.value.length === 0) {
		await loadAllDoctors();
	}
};

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
.admin-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.row { margin-top: 14px; }
.all-doctors-panel {
	display: grid;
	gap: 10px;
}
.all-doctors-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
}
.all-doctors-hint {
	margin: 0;
	color: #475569;
}
.toggle-btn {
	min-height: 38px;
	padding: 0 12px;
	border: 1px solid #cbd5e1;
	background: #ffffff;
}
.item {
	border: 1px solid #d1d5db;
	background: #f9fafb;
	padding: 12px;
	min-height: 100%;
}
.item p { margin: 0 0 8px; }
.item p:last-child { margin-bottom: 0; }

@media (max-width: 900px) {
	.search { grid-template-columns: 1fr; }

	.toggle-btn {
		width: 100%;
	}
}
</style>
