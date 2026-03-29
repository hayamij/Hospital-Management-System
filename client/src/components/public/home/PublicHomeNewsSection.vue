<template>
  <section class="section">
    <header class="section-head">
      <h2>Tin tức / Thông báo mới nhất</h2>
    </header>

    <div class="news-row">
      <RouterLink
        v-for="news in newsItems"
        :key="news.id"
        :to="{ path: `/home-feature/news/${news.id}` }"
        class="card-link"
      >
        <article class="news-card">
          <small>{{ news.date }}</small>
          <h3>{{ news.title }}</h3>
          <p>{{ news.summary }}</p>
        </article>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
defineProps({
  newsItems: { type: Array, default: () => [] },
});
</script>

<style scoped>
.section {
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 28px;
}

.section-head h2 {
  margin: 0;
}

.news-row {
  margin-top: 18px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.news-card {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 18px;
}
</style>
