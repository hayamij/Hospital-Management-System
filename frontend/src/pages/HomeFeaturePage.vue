<template>
  <div class="feature-page">
    <p class="back-link-wrap"><RouterLink class="back-link" to="/">← Back to home</RouterLink></p>

    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">{{ group.toUpperCase() }}</p>
          <h1>{{ view.title }}</h1>
          <p class="subtitle">{{ view.subtitle }}</p>
          <p class="description">{{ view.description }}</p>
          <div class="hero-actions">
            <RouterLink class="btn primary" :to="primaryCta.to">{{ primaryCta.label }}</RouterLink>
            <RouterLink class="btn" to="/public">Open public portal</RouterLink>
          </div>
        </div>
        <img :src="heroImage" :alt="`Feature image ${view.title}`" loading="lazy" />
      </div>
    </header>

    <section class="panel meta-panel">
      <div class="meta-item">
        <span>Group</span>
        <strong>{{ group }}</strong>
      </div>
      <div class="meta-item">
        <span>ID</span>
        <strong>{{ id }}</strong>
      </div>
      <div class="meta-item">
        <span>Next step</span>
        <strong>{{ primaryCta.label }}</strong>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const group = computed(() => String(route.params.group || 'feature'));
const id = computed(() => String(route.params.id || 'unknown'));

const imageByGroup = {
  news: '/assets/images/banner2.png',
  step: '/assets/images/hospital2.png',
  insurance: '/assets/images/room.png',
  constraint: '/assets/images/hospital.png',
};

const catalog = {
  step: {
    'medical-services': {
      title: 'Medical Services',
      subtitle: 'Explore medical services available for patients.',
      description: 'This section introduces core medical support and outpatient consultation tracks.',
    },
    'find-doctor': {
      title: 'Find A Doctor',
      subtitle: 'Search by specialty and experience.',
      description: 'Use doctor search and filtering to locate the right physician quickly.',
    },
    appointment: {
      title: 'Make An Appointment',
      subtitle: 'Start from available slots and preferred doctor.',
      description: 'Booking flow supports doctor schedule visibility and patient constraints.',
    },
    question: {
      title: 'Ask Us A Question',
      subtitle: 'Get support before registration.',
      description: 'Submit contact requests for guidance on departments, insurance, and prep.',
    },
    'home-care': {
      title: 'Healthcare At Home',
      subtitle: 'Care pathways for remote support.',
      description: 'Home-care services cover consultation follow-up and nurse-assisted instructions.',
    },
  },
  insurance: {},
  constraint: {},
  news: {
    'outpatient-expand': {
      title: 'Outpatient Expansion',
      subtitle: 'Capacity improvements for daily care.',
      description: 'New counters and faster check-in process reduce waiting time.',
    },
    'new-specialists': {
      title: 'New Specialists Joined',
      subtitle: 'Expanded expertise in key departments.',
      description: 'Additional specialists strengthen diagnosis and treatment quality.',
    },
    'online-queue': {
      title: 'Online Queue Pilot',
      subtitle: 'Track clinic queue remotely.',
      description: 'Patients can monitor queue position before arriving at the facility.',
    },
  },
};

const defaultView = {
  title: 'Feature Detail',
  subtitle: 'Home element detail page.',
  description: 'This feature is available in the home navigation flow.',
};

const view = computed(() => {
  const groupMap = catalog[group.value] || {};
  return groupMap[id.value] || {
    ...defaultView,
    title: `${group.value} detail`,
  };
});

const heroImage = computed(() => imageByGroup[group.value] || '/assets/images/image.png');

const primaryCta = computed(() => {
  if (group.value === 'news') return { label: 'Book appointment', to: '/patient/booking' };
  if (group.value === 'step' && id.value === 'find-doctor') return { label: 'Find doctor now', to: '/doctors' };
  if (group.value === 'step' && id.value === 'medical-services') return { label: 'Browse services', to: '/services' };
  return { label: 'Start booking', to: '/patient/booking' };
});
</script>

<style scoped>
.feature-page {
  display: grid;
  gap: 20px;
}

.back-link-wrap {
  margin: 0;
}

.back-link {
  text-decoration: none;
  color: #1e293b;
  border-bottom: 1px solid #94a3b8;
}

.hero {
  background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.hero-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 1fr);
  align-items: center;
}

.hero-grid img {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border: 1px solid #fed7aa;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.subtitle {
  margin: 10px 0 0;
  color: #334155;
}

.description {
  margin: 10px 0 0;
  color: #334155;
  line-height: 1.7;
}

.hero-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.btn.primary {
  border-color: #ea580c;
  background: #ea580c;
  color: #ffffff;
}

.meta-panel {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.meta-item {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 12px;
}

.meta-item span {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.meta-item strong {
  color: #0f172a;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
