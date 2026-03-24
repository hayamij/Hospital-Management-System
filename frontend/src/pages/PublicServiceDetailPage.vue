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
      <button v-if="!loading && error" type="button" class="retry-btn" @click="load">Retry</button>
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
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const service = ref(null);
const allServices = ref([]);
const hasFetched = ref(false);
let currentRequestId = 0;

const detailImages = [
  '/assets/images/hospital2.png',
  '/assets/images/room2.png',
  '/assets/images/doctor-image.png',
  '/assets/images/hospital.png',
  '/assets/images/banner2.png',
  '/assets/images/image.png',
];

const normalizeService = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const source = payload.service && typeof payload.service === 'object'
    ? payload.service
    : payload;

  if (!source || typeof source !== 'object') {
    return null;
  }

  return {
    id: source.id || null,
    name: source.name || source.title || '',
    description: source.description || '',
    price: source.price ?? null,
    image: source.image || detailImages[Math.abs(String(source.id || source.name || '').length) % detailImages.length],
  };
};

const bookingLink = computed(() => {
  if (!service.value?.id) return '/register';
  return `/patient/booking?service=${encodeURIComponent(service.value.id)}`;
});

const relatedServices = computed(() => {
  if (!service.value?.id) return [];
  return allServices.value
    .filter((item) => item.id && item.id !== service.value.id)
    .slice(0, 3);
});

const formatPrice = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `${amount.toLocaleString('vi-VN')} VND`;
};

const loadRelatedServices = async () => {
  try {
    const response = await guestApi.publicInfo();
    const list = Array.isArray(response?.services) ? response.services : [];
    allServices.value = list.map((item, index) => ({
      id: item?.id || `svc-${index + 1}`,
      name: item?.name || item?.title || 'Service',
      description: item?.description || '',
      price: item?.price ?? null,
      image: detailImages[index % detailImages.length],
    }));
  } catch {
    allServices.value = [];
  }
};

const load = async () => {
  const serviceId = String(route.params.serviceId || '').trim();
  const requestId = ++currentRequestId;

  hasFetched.value = false;
  loading.value = true;
  error.value = '';
  service.value = null;

  if (!serviceId) {
    loading.value = false;
    error.value = 'Invalid service id.';
    hasFetched.value = true;
    return;
  }

  try {
    const [response] = await Promise.all([
      guestApi.getServiceDetail(serviceId),
      loadRelatedServices(),
    ]);

    if (requestId !== currentRequestId) {
      return;
    }

    service.value = normalizeService(response);
  } catch (e) {
    if (requestId !== currentRequestId) {
      return;
    }

    error.value = e?.message || 'Failed to load service detail.';
  } finally {
    if (requestId === currentRequestId) {
      loading.value = false;
      hasFetched.value = true;
    }
  }
};

watch(() => route.params.serviceId, load, { immediate: true });
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
  margin: 14px 0 0;
  color: #334155;
  line-height: 1.7;
  max-width: 60ch;
}

.meta-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 9px;
  color: #334155;
}

.price {
  margin: 16px 0 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  color: #0f766e;
}

.hero-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.cta {
  min-height: 44px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #0f172a;
  text-decoration: none;
  font-weight: 600;
}

.cta.primary {
  background: #0f172a;
  color: #ffffff;
}

.cta.secondary {
  background: #ffffff;
  color: #0f172a;
}

.hero-media img {
  width: 100%;
  height: 100%;
  min-height: 320px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.status-panel {
  display: grid;
  gap: 10px;
}

.status-text {
  margin: 0;
}

.details-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
}

.info-card {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  padding: 18px;
}

.info-card h2 {
  margin: 0;
  font-size: 26px;
}

.info-card p {
  margin: 12px 0 0;
  color: #334155;
  line-height: 1.7;
}

.info-card ul {
  margin: 14px 0 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.8;
}

.quick-card {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  padding: 18px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.quick-card h3 {
  margin: 0;
}

.quick-btn {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: #0f172a;
}

.related-head h2 {
  margin: 0;
}

.related-head p {
  margin: 8px 0 0;
  color: #475569;
}

.related-grid {
  margin-top: 16px;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.related-link {
  text-decoration: none;
  color: inherit;
}

.related-card {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  padding: 12px;
  height: 100%;
}

.related-card img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.related-card h3 {
  margin: 10px 0 6px;
  font-size: 19px;
}

.related-card p {
  margin: 0;
  color: #334155;
}

.sub-price {
  margin-top: 8px !important;
  color: #0f766e !important;
  font-weight: 600;
}

.msg.err {
  color: #b91c1c;
}

.retry-btn {
  margin-top: 8px;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid #9ca3af;
  background: #f9fafb;
}

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-media img {
    min-height: 260px;
  }

  .hero-copy h1 {
    font-size: 32px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
