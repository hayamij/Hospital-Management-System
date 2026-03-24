<template>
  <header class="public-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/">Hospital Management</RouterLink>

      <div class="right-zone">
        <span class="auth-chip">
          {{ auth.isAuthenticated ? `Signed in: ${auth.email || auth.role}` : 'Not signed in' }}
        </span>

        <nav class="menu">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/public">Public Portal</RouterLink>
          <RouterLink to="/usecases">Use Cases</RouterLink>
          <template v-if="!auth.isAuthenticated">
            <RouterLink to="/login">Login</RouterLink>
            <RouterLink to="/register">Register</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/appointments">Appointments</RouterLink>
            <RouterLink to="/patients">Patients</RouterLink>
            <RouterLink to="/doctors">Doctors</RouterLink>
            <RouterLink to="/records">Records</RouterLink>
            <RouterLink v-if="auth.role === 'doctor'" to="/doctor-ops">Doctor Ops</RouterLink>
            <RouterLink v-if="auth.role === 'admin'" to="/dashboard">Dashboard</RouterLink>
            <RouterLink v-if="auth.role === 'admin'" to="/admin-ops">Admin Ops</RouterLink>
            <RouterLink v-if="auth.role === 'patient' || auth.role === 'doctor'" to="/communications">Messages</RouterLink>
            <RouterLink v-if="auth.role === 'patient' || auth.role === 'admin'" to="/billing">Billing</RouterLink>
            <RouterLink class="user-link" :to="userRoute">User</RouterLink>
            <button type="button" class="logout" @click="handleLogout">Logout</button>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();
auth.hydrate();
const router = useRouter();

const userRoute = computed(() => {
  if (auth.role === 'admin') return '/admin-ops';
  if (auth.role === 'doctor') return '/doctor-ops';
  if (auth.role === 'patient') return '/patients';
  return '/login';
});

const handleLogout = async () => {
  await auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.public-header {
  width: 100%;
  background: #ffffff;
  border-bottom: 1px solid #d1d5db;
}

.header-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  box-sizing: border-box;
}

.right-zone {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.auth-chip {
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #111827;
  padding: 7px 10px;
  font-size: 12px;
}

.brand {
  font-weight: 700;
  color: #111827;
  text-decoration: none;
}

.menu {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.menu a,
.logout {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  text-decoration: none;
  padding: 7px 10px;
  cursor: pointer;
}

.menu a.router-link-active {
  background: #eef2ff;
  border-color: #9ca3af;
}

@media (max-width: 900px) {
  .header-inner {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px;
  }

  .right-zone {
    justify-content: flex-start;
  }

  .menu {
    justify-content: flex-start;
  }
}
</style>