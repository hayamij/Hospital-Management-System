<template>
  <div class="service-detail-page">
    <p class="back-link-wrap">
      <RouterLink class="back-link" to="/services">← Back to all services</RouterLink>
    </p>

    <section class="hero panel" v-if="!loading && service">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">SERVICE DETAIL</p>
          <h1>{{ service.name || 'Service' }}</h1>
          <p class="lead">
            {{ service.description || 'Service details are available at the clinic desk.' }}
          </p>

          <div class="meta-row">
            <span class="meta-item">Fast booking</span>
            <span class="meta-item">Doctor-reviewed process</span>
            <span class="meta-item">Transparent pricing</span>
          </div>

          <p v-if="service.price !== null && service.price !== undefined" class="price">
            {{ formatPrice(service.price) }}
          </p>

          <div class="hero-actions">
            <RouterLink class="cta primary" :to="bookingLink">Book appointment</RouterLink>
            <RouterLink class="cta secondary" to="/public">Talk to advisor</RouterLink>
          </div>
        </div>

        <div class="hero-media" aria-hidden="true">
          <img :src="service.image" :alt="`Service image ${service.name || 'service'}`" loading="lazy" />
        </div>
      </div>
    </section>

    <section class="panel status-panel" v-if="loading || error || (!service && hasFetched)">
      <p v-if="loading" class="status-text">Loading service detail...</p>
      <p v-else-if="error" class="msg err">{{ error }}</p>
      <p v-else-if="hasFetched">Service not found.</p>
      <button v-if="!loading && error" type="button" class="retry-btn" @click="$emit('retry')">Retry</button>
    </section>

    <section class="panel details" v-if="!loading && service">
      <div class="details-grid">
        <article class="info-card">
          <h2>Service overview</h2>
          <p>
            This service is designed to keep diagnosis and care pathways clear from first check-in to follow-up.
            You will receive guidance on preparation, expected timeline, and post-visit instructions.
          </p>
          <ul>
            <li>Digital queue support at check-in.</li>
            <li>Coordinated workflow across doctor and records team.</li>
            <li>Follow-up recommendations included after consultation.</li>
          </ul>
        </article>

        <aside class="quick-card">
          <h3>Quick actions</h3>
          <RouterLink class="quick-btn" :to="bookingLink">Book this service</RouterLink>
          <RouterLink class="quick-btn" to="/doctors">Choose doctor first</RouterLink>
          <RouterLink class="quick-btn" to="/news">See latest updates</RouterLink>
        </aside>
      </div>
    </section>

    <section class="panel related" v-if="!loading && relatedServices.length > 0">
      <header class="related-head">
        <h2>Related services</h2>
        <p>Explore other services commonly selected by patients together with this option.</p>
      </header>

      <div class="related-grid">
        <RouterLink
          v-for="item in relatedServices"
          :key="item.id"
          :to="`/services/${item.id}`"
          class="related-link"
        >
          <article class="related-card">
            <img :src="item.image" :alt="`Service image ${item.name}`" loading="lazy" />
            <h3>{{ item.name }}</h3>
            <p>{{ item.description || 'Service details are available at the clinic desk.' }}</p>
            <p class="sub-price" v-if="item.price !== null && item.price !== undefined">{{ formatPrice(item.price) }}</p>
          </article>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, required: true },
  error: { type: String, default: '' },
  service: { type: Object, default: null },
  hasFetched: { type: Boolean, required: true },
  bookingLink: { type: String, required: true },
  relatedServices: { type: Array, required: true },
  formatPrice: { type: Function, required: true },
});

defineEmits(['retry']);
</script>

<style scoped>
.service-detail-page {
  display: grid;
  gap: 22px;
}

.back-link-wrap {
  margin: 0;
}

.back-link {
  color: #1e293b;
  text-decoration: none;
  border-bottom: 1px solid #94a3b8;
  padding-bottom: 2px;
}

.hero {
  border: 1px solid #cbd5e1;
  background: linear-gradient(115deg, #f8fafc 0%, #eef2ff 55%, #f1f5f9 100%);
}

.hero-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
  align-items: stretch;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #0f766e;
}

.hero-copy h1 {
  margin: 10px 0 0;
  font-size: 38px;
  line-height: 1.15;
  color: #0f172a;
}

.lead {
  margin: 12px 0 0;
  color: #334155;
  max-width: 620px;
}

.meta-row {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 4px 10px;
  font-size: 12px;
  color: #334155;
}

.price {
  margin: 14px 0 0;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.hero-actions {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cta {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 600;
}

.cta.primary {
  background: #0f172a;
  color: #f8fafc;
}

.cta.secondary {
  color: #0f172a;
  background: #fff;
}

.hero-media img {
  width: 100%;
  height: 100%;
  min-height: 260px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.status-panel {
  border: 1px dashed #94a3b8;
  background: #f8fafc;
}

.status-text {
  margin: 0;
  color: #334155;
}

.retry-btn {
  margin-top: 10px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #475569;
  background: #fff;
}

.details {
  border: 1px solid #e2e8f0;
}

.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
  gap: 14px;
}

.info-card {
  border: 1px solid #e2e8f0;
  background: #fff;
  padding: 14px;
}

.info-card h2 {
  margin: 0;
}

.info-card p {
  color: #334155;
}

.info-card ul {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #334155;
}

.quick-card {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 14px;
  display: grid;
  gap: 8px;
  align-content: start;
}

.quick-card h3 {
  margin: 0 0 4px;
}

.quick-btn {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid #94a3b8;
  color: #0f172a;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  background: #fff;
}

.related {
  border: 1px solid #e2e8f0;
}

.related-head h2 {
  margin: 0;
}

.related-head p {
  margin: 8px 0 0;
  color: #475569;
}

.related-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.related-link {
  text-decoration: none;
  color: inherit;
}

.related-card {
  border: 1px solid #dbeafe;
  background: #fff;
  padding: 10px;
  display: grid;
  gap: 8px;
  min-height: 100%;
}

.related-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.related-card h3,
.related-card p {
  margin: 0;
}

.related-card p {
  color: #334155;
}

.sub-price {
  font-weight: 700;
  color: #0f172a;
}

.msg.err {
  color: #b91c1c;
}

@media (max-width: 1024px) {
  .hero-grid,
  .details-grid {
    grid-template-columns: 1fr;
  }

  .hero-media img {
    min-height: 220px;
  }
}
</style>
