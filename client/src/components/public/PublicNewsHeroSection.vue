<template>
  <header class="panel hero">
    <div class="hero-grid">
      <div>
        <p class="eyebrow">Tin tức</p>
        <h1>Tin tức y khoa và thông báo</h1>
        <p class="lead">
          Cập nhật kiến thức y khoa, thông báo vận hành và các chương trình chăm sóc cộng đồng.
        </p>
      </div>
      <img class="hero-cover" :src="coverImage" alt="Bệnh viện hiện đại" loading="lazy" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  coverImage: { type: String, required: true },
});
</script>

<style scoped>
.hero {
  background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.hero-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
  align-items: center;
}

.hero-cover {
  width: 100%;
  height: 230px;
  object-fit: cover;
  border: 1px solid #fed7aa;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #b45309;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 34px;
  line-height: 1.2;
}

.lead {
  margin: 12px 0 0;
  max-width: 760px;
  color: #334155;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-cover {
    height: 190px;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
