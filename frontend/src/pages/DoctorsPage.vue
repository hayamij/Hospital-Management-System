<template>
	<div class="page">
		<header class="panel">
			<h1>Doctors</h1>
			<p>Search doctors by keyword and specialization.</p>
			<form class="search" @submit.prevent="search">
				<input v-model="filters.query" placeholder="Name or keyword" />
				<input v-model="filters.specialty" placeholder="Specialty" />
				<button type="submit">Search</button>
				<button type="button" @click="search">Refresh</button>
			</form>
		</header>

		<section class="panel">
			<h2>Doctor list</h2>
			<p v-if="doctors.loading">Loading...</p>
			<p v-if="!doctors.loading && doctors.list.length === 0">No doctors found.</p>
			<div class="grid two-col">
				<article v-for="doc in doctors.list" :key="doc.id || doc.doctorId" class="item">
					<p><strong>{{ doc.fullName || doc.name }}</strong></p>
					<p>{{ doc.specialization || doc.specialty }}</p>
					<p>Status: {{ doc.status || 'active' }}</p>
				</article>
			</div>
		</section>

		<section v-if="auth.role === 'admin'" class="panel">
			<h2>Service catalog actions (admin)</h2>
			<form class="grid admin-grid" @submit.prevent="upsertService">
				<input v-model="service.id" placeholder="Service ID" />
				<input v-model="service.name" placeholder="Service name" required />
				<input v-model.number="service.price" type="number" min="0" placeholder="Price" required />
				<button type="submit">Upsert service</button>
			</form>
			<form class="row" @submit.prevent="removeService">
				<input v-model="removeServiceId" placeholder="Service ID to remove" required />
				<button type="submit">Remove service</button>
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
  status.value = 'Service upsert completed.';
};

const removeService = async () => {
  status.value = '';
  await doctors.removeService(removeServiceId.value);
  status.value = 'Service removal completed.';
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
