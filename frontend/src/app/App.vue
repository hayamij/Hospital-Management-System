<template>
  <div class="layout">
    <NavBar />
    <div class="layout__body">
      <SideBar />
      <main class="layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import NavBar from '../components/navigation/NavBar.vue';
import SideBar from '../components/navigation/SideBar.vue';
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f1f5f9;
  color: #0f172a;
  display: flex;
  flex-direction: column;
}

.layout__body {
  display: grid;
  grid-template-columns: 240px 1fr;
}

.layout__content {
  padding: 1rem;
}

@media (max-width: 900px) {
  .layout__body {
    grid-template-columns: 1fr;
  }

  .layout__content {
    padding: 0.75rem;
  }
}
</style>
