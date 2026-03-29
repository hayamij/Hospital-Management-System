<template>
  <div class="home">
    <PublicHomeHeroVisualSection />

    <PublicHomeDiscoverySection
      :search="search"
      :doctors="doctors"
      :specialties="specialties"
      :specialty-link="specialtyLink"
      @search="searchDoctors"
      @update:query="search.query = $event"
      @update:specialty="search.specialty = $event"
    />

    <PublicHomeNewsSection :news-items="newsItems" />

    <p v-if="error" class="status err">{{ error }}</p>
  </div>
</template>

<script setup>
import PublicHomeHeroVisualSection from '../components/public/home/PublicHomeHeroVisualSection.vue';
import PublicHomeDiscoverySection from '../components/public/home/PublicHomeDiscoverySection.vue';
import PublicHomeNewsSection from '../components/public/home/PublicHomeNewsSection.vue';
import { useHomePageOrchestration } from '../composables/useHomePageOrchestration.js';

const { doctors, specialties, error, search, newsItems, specialtyLink, searchDoctors } = useHomePageOrchestration();
</script>

<style scoped>
.home {
  width: 100%;
  margin: 0 auto;
  color: #1f2937;
  display: grid;
  gap: 18px;
}

.status {
  margin-top: 0;
  border: 1px solid #d1d5db;
  padding: 12px 14px;
}

.status.err {
  background: #fef2f2;
  border-color: #fca5a5;
}
</style>
