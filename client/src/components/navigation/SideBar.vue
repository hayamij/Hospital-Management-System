<template>
	<aside class="sidebar">
		<nav class="menu">
			<template v-for="item in items" :key="item.path">
				<RouterLink
					:to="item.path"
					class="menu-item"
					:class="{ active: isActive(item) }"
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
import { BACKOFFICE_SIDEBAR_ITEMS } from '../../constants/navigation.js';

const auth = useAuthStore();
const route = useRoute();

const items = computed(() => BACKOFFICE_SIDEBAR_ITEMS[auth.role] || []);

const isActive = (item) => {
	const [path, hash] = String(item.path || '').split('#');
	if (route.path !== path) return false;
	if (!hash) return true;
	return route.hash === `#${hash}`;
};
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
