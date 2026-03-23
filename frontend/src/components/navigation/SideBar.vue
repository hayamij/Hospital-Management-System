<template>
	<aside class="sidebar">
		<nav class="menu">
			<template v-for="item in items" :key="item.path">
				<RouterLink
					:to="item.path"
					class="menu-item"
					:class="{ active: route.path === item.path }"
				>
					<span class="icon">{{ item.icon }}</span>
					<span>{{ item.label }}</span>
				</RouterLink>
			</template>
		</nav>
	</aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();

const navByRole = {
	doctor: [
		{ label: 'Use Cases', path: '/usecases', icon: 'UC' },
		{ label: 'Doctor Ops', path: '/doctor-ops', icon: 'DO' },
		{ label: 'Schedule', path: '/appointments', icon: 'SC' },
		{ label: 'Patients', path: '/patients', icon: 'PT' },
		{ label: 'Records', path: '/records', icon: 'MR' },
		{ label: 'Messages', path: '/communications', icon: 'MS' },
	],
	admin: [
		{ label: 'Use Cases', path: '/usecases', icon: 'UC' },
		{ label: 'Dashboard', path: '/dashboard', icon: 'DB' },
		{ label: 'Appointments', path: '/appointments', icon: 'AP' },
		{ label: 'Doctors', path: '/doctors', icon: 'DR' },
		{ label: 'Patients', path: '/patients', icon: 'PT' },
		{ label: 'Billing', path: '/billing', icon: 'BL' },
		{ label: 'Records', path: '/records', icon: 'MR' },
		{ label: 'Admin Ops', path: '/admin-ops', icon: 'AO' },
	],
};

const items = computed(() => navByRole[auth.role] || []);
</script>

<style scoped>
.sidebar {
	border: 1px solid #d1d5db;
	background: #fff;
	height: fit-content;
}

.menu {
	display: grid;
	gap: 6px;
	padding: 10px;
}

.menu-item {
	display: flex;
	align-items: center;
	gap: 8px;
	border: 1px solid #d1d5db;
	padding: 8px;
	text-decoration: none;
	color: #111827;
	background: #f9fafb;
}

.menu-item.active {
	border-color: #6b7280;
	background: #eef2ff;
}

.icon {
	font-size: 12px;
	border: 1px solid #d1d5db;
	padding: 2px 4px;
	min-width: 24px;
	text-align: center;
}

@media (max-width: 1100px) {
	.sidebar {
		display: none;
	}
}
</style>
