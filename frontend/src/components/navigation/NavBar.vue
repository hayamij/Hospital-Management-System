<template>
  <header class="topbar">
    <div class="topbar-center">
      <div>
        <p class="title">Hospital Management</p>
        <p class="meta">Backoffice for doctor and admin</p>
      </div>
      <div class="right">
        <div>
          <p>{{ auth.email || 'unknown' }}</p>
          <small>{{ auth.role || 'unauthenticated' }}</small>
        </div>
				<div class="manager-links" v-if="managementLinks.length">
					<RouterLink v-for="item in managementLinks" :key="item.to" class="user-link" :to="item.to">{{ item.label }}</RouterLink>
				</div>
        <button v-if="auth.isAuthenticated" type="button" @click="handleLogout">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();

const managementLinks = computed(() => {
	if (auth.role === 'admin') {
		return [
			{ label: 'Overview', to: '/admin/dashboard#overview' },
			{ label: 'Users', to: '/admin/dashboard#users' },
			{ label: 'Services', to: '/admin/dashboard#services' },
			{ label: 'Billing', to: '/admin/dashboard#billing' },
			{ label: 'Reports', to: '/admin/dashboard#reports' },
		];
	}

	if (auth.role === 'doctor') {
		return [
			{ label: 'Doctor Ops', to: '/doctor/dashboard' },
			{ label: 'Consultation', to: '/doctor/consultation' },
			{ label: 'Schedule', to: '/doctor/appointments' },
			{ label: 'Records', to: '/doctor/records' },
			{ label: 'Messages', to: '/doctor/communications' },
		];
	}

	return [];
});

const handleLogout = async () => {
	await auth.logout();
	router.push('/login');
};
</script>

<style scoped>
.topbar {
	position: sticky;
	top: 0;
	z-index: 20;
	background: #fff;
	border-bottom: 1px solid #d1d5db;
}

.topbar-center {
	width: min(1500px, 60vw);
	margin: 0 auto;
	min-height: 72px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}

.title { margin: 0; font-weight: 700; }
.meta { margin: 2px 0 0; font-size: 12px; color: #4b5563; }
.right { display: flex; gap: 16px; align-items: center; text-align: right; }
.right p { margin: 0; }
.right small { color: #4b5563; }
.manager-links { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.user-link { border: 1px solid #9ca3af; background: #f9fafb; padding: 8px 12px; color: #111827; text-decoration: none; }
.right button { border: 1px solid #9ca3af; background: #f9fafb; padding: 8px 12px; cursor: pointer; }

@media (max-width: 1100px) {
	.topbar-center { width: min(1500px, 92vw); }
}
</style>
