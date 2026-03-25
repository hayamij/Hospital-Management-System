<template>
  <div class="public-shell">
    <PublicHeader />
    <main class="public-main">
      <div class="content-center">
        <RouterView />
      </div>
    </main>
    <PublicFooter />
  </div>
</template>

<script setup>
import PublicHeader from '../../components/navigation/PublicHeader.vue';
import PublicFooter from '../../components/navigation/PublicFooter.vue';
</script>

<style scoped>
.public-main {
  min-height: 100vh;
  padding: 24px 0 34px;
}

.content-center {
  width: min(1500px, 60vw);
  margin: 0 auto;
}

@media (max-width: 1100px) {
  .content-center {
    width: min(1500px, 92vw);
  }
}
</style>
