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
		{ label: 'Vận hành bác sĩ', path: '/doctor/dashboard', icon: 'DO' },
		{ label: 'Khám bệnh', path: '/doctor/consultation', icon: 'CS' },
		{ label: 'Lịch hẹn', path: '/doctor/appointments', icon: 'SC' },
		{ label: 'Bệnh nhân', path: '/doctor/patients', icon: 'PT' },
		{ label: 'Hồ sơ', path: '/doctor/records', icon: 'MR' },
		{ label: 'Tin nhắn', path: '/doctor/communications', icon: 'MS' },
	],
	admin: [
		{ label: 'Bảng điều khiển', path: '/admin/dashboard', icon: 'DB' },
		{ label: 'Quản lý nhân sự', path: '/admin/ops#staff', icon: 'HR' },
		{ label: 'Quản lý bệnh nhân', path: '/admin/patients', icon: 'PT' },
		{ label: 'Quản lý dịch vụ', path: '/admin/ops#services', icon: 'SV' },
		{ label: 'Lịch trình', path: '/admin/appointments', icon: 'SC' },
		{ label: 'Tài chính', path: '/admin/billing', icon: 'FN' },
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
