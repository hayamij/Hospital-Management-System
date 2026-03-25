<template>
  <aside class="sidebar">
    <nav class="menu">
      <RouterLink
        v-for="item in adminItems"
        :key="item.path"
        :to="item.path"
        class="menu-item"
        :class="{ active: route.path === item.path }"
      >
        <span class="icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

const adminItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'DB' },
  { label: 'Quan ly Nhan su', path: '/admin/ops#staff', icon: 'HR' },
  { label: 'Quan ly Benh nhan', path: '/admin/patients', icon: 'PT' },
  { label: 'Quan ly Dich vu', path: '/admin/ops#services', icon: 'SV' },
  { label: 'Lich trinh', path: '/admin/appointments', icon: 'SC' },
  { label: 'Tai chinh', path: '/admin/billing', icon: 'FN' },
];
</script>

<style scoped>
.sidebar {
  border: 1px solid #d1d5db;
  background: #ffffff;
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
