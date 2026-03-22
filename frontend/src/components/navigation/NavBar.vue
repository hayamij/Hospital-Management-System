<template>
  <nav class="nav-bar">
    <div class="nav-bar__brand">Hospital Management</div>
    <div class="nav-bar__controls">
      <label class="nav-bar__label">
        Role
        <select v-model="selectedRole">
          <option value="guest">Guest</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <input v-model="displayName" placeholder="Name" class="nav-bar__input" />
      <button @click="handleLogin">Login</button>
      <button @click="handleLogout" class="secondary">Logout</button>
      <span class="nav-bar__user">User: {{ store.user.name }} ({{ store.currentUserRole }})</span>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAppStore } from '../../stores/index.js';

const store = useAppStore();
const selectedRole = ref('guest');
const displayName = ref('Guest');

const handleLogin = async () => {
  const name = displayName.value || selectedRole.value;
  const email = `${selectedRole.value}@demo.local`;
  const password = 'password';
  if (selectedRole.value === 'doctor') {
    await store.doctorLogin({ name, email, password });
    return;
  }
  if (selectedRole.value === 'admin') {
    await store.adminLogin({ name, email, password });
    return;
  }
  await store.login({ role: selectedRole.value, name, email, password });
};

const handleLogout = async () => {
  await store.logout();
};

watch(
  () => store.user,
  (user) => {
    selectedRole.value = user.role;
    displayName.value = user.name;
  },
  { deep: true }
);
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #0f172a;
  color: #f8fafc;
}

.nav-bar__brand {
  font-weight: 700;
  letter-spacing: 0.5px;
}

.nav-bar__controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

select,
input,
button {
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
}

button {
  cursor: pointer;
  border: none;
  background: #2563eb;
  color: #fff;
}

button.secondary {
  background: #475569;
}

.nav-bar__user {
  font-size: 0.9rem;
}

.nav-bar__label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.nav-bar__input {
  min-width: 140px;
}
</style>
