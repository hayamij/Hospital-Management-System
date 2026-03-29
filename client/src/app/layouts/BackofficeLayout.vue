<template>
  <div class="backoffice-shell">
    <NavBar />
    <div class="shell-center">
      <AdminSideBar v-if="auth.role === 'admin'" />
      <SideBar v-else />
      <main class="shell-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js';
import NavBar from '../../components/navigation/NavBar.vue';
import SideBar from '../../components/navigation/SideBar.vue';
import AdminSideBar from '../../components/navigation/AdminSideBar.vue';

const auth = useAuthStore();
auth.fetchCurrentUser();
</script>

<style scoped>
.shell-center {
  min-height: calc(100vh - 64px);
  width: min(1500px, 60vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  padding: 24px 0 32px;
}

.shell-main {
  width: 100%;
}

@media (max-width: 1100px) {
  .shell-center {
    width: min(1500px, 92vw);
    grid-template-columns: 1fr;
  }
}
</style>
