<template>
  <div class="app-shell">
    <template v-if="showChrome">
      <NavBar />
      <div class="shell-center">
        <SideBar />
        <main class="shell-main">
          <router-view />
        </main>
      </div>
    </template>
    <template v-else>
      <PublicHeader />
      <main class="public-main">
        <div class="content-center">
          <router-view />
        </div>
      </main>
      <PublicFooter />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import NavBar from '../components/navigation/NavBar.vue';
import SideBar from '../components/navigation/SideBar.vue';
import PublicHeader from '../components/navigation/PublicHeader.vue';
import PublicFooter from '../components/navigation/PublicFooter.vue';

const route = useRoute();
const auth = useAuthStore();

const showChrome = computed(() => {
  auth.hydrate();
  if (route.meta?.public) return false;
  return auth.role === 'doctor' || auth.role === 'admin';
});
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

.public-main {
  min-height: 100vh;
  padding: 24px 0 34px;
}

.content-center {
  width: min(1500px, 60vw);
  margin: 0 auto;
}

@media (max-width: 1100px) {
  .shell-center {
    width: min(1500px, 92vw);
    grid-template-columns: 1fr;
  }

  .content-center {
    width: min(1500px, 92vw);
  }
}
</style>
