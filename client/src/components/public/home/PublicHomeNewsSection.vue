<template>
  <section class="section">
    <header class="section-head">
      <h2>Tin tức / Thông báo mới nhất</h2>
    </header>

    <SlidingPager
      :items="newsItems"
      :items-per-page="3"
      :mobile-items-per-page="1"
      empty-text="Chưa có thông báo mới."
    >
      <template #default="{ item: news }">
        <RouterLink
          :to="{ path: `/home-feature/news/${news.id}` }"
          class="card-link"
        >
          <article class="news-card">
            <small>{{ news.date }}</small>
            <h3>{{ news.title }}</h3>
            <p>{{ news.summary }}</p>
          </article>
        </RouterLink>
      </template>
    </SlidingPager>
  </section>
</template>

<script setup>
import SlidingPager from '../../shared/SlidingPager.vue';

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

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.news-card {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 18px;
  height: 100%;
  box-sizing: border-box;
}
</style>
