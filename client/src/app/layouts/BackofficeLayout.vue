<template>
  <div class="backoffice-shell">
    <PublicHeader />
    <div class="shell-center" :class="{ 'admin-wide': auth.role === 'admin' }">
      <SideBar />
      <main class="shell-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../../stores/auth.js';
import PublicHeader from '../../components/navigation/PublicHeader.vue';
import SideBar from '../../components/navigation/SideBar.vue';

const auth = useAuthStore();
auth.fetchCurrentUser();
</script>

<style scoped>
.shell-center {
  min-height: calc(100vh - 72px);
  width: min(1700px, 94vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 18px;
  padding: 24px 0 32px;
}

.shell-center.admin-wide {
  width: min(1860px, 97vw);
}

.shell-main {
  width: 100%;
  min-width: 0;
}

@media (max-width: 1100px) {
  .shell-center {
    width: 92vw;
    grid-template-columns: 1fr;
    padding-top: 16px;
  }
}
</style>
