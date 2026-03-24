<template>
  <div class="home">
    <section class="banner">
      <div>
        <p class="banner-label">Welcome</p>
        <h1>Reliable Healthcare For Everyone</h1>
        <p>
          This is the first version of the home page. It contains basic sections:
          banner, services, doctor search, news, and contact form.
        </p>
      </div>
      <div class="banner-actions">
        <button type="button" @click="loadPublicInfo">Load public info</button>
        <RouterLink to="/appointments">Book appointment</RouterLink>
      </div>
    </section>

    <section class="ticker-wrap">
      <div class="ticker-track">
        <RouterLink
          v-for="item in tickerItems"
          :key="item.id"
          :to="{ path: `/home-feature/step/${item.id}` }"
          class="ticker-item"
        >
          {{ item.label }}
        </RouterLink>
      </div>
    </section>

    <section id="services" class="section">
      <h2>Services</h2>
      <div class="service-grid">
        <article v-for="service in services" :key="service.id || service.title" class="service-card">
          <h3>{{ service.title }}</h3>
          <p>{{ service.description }}</p>
          <p v-if="service.price !== undefined"><strong>Price:</strong> {{ service.price }}</p>
          <RouterLink :to="service.detailRoute">Use service</RouterLink>
        </article>
      </div>
    </section>

    <section id="insurance" class="section">
      <h2>Insurance Plans</h2>
      <div class="service-grid">
        <article v-for="plan in insurancePlans" :key="plan.id || plan.planName" class="service-card">
          <h3>{{ plan.planName }}</h3>
          <p><strong>Provider:</strong> {{ plan.provider }}</p>
          <p>{{ plan.coverageSummary }}</p>
          <p><strong>Copay:</strong> {{ plan.copayAmount }}</p>
          <RouterLink :to="{ path: `/home-feature/insurance/${plan.id}` }">View details</RouterLink>
        </article>
      </div>
    </section>

    <section id="booking-rules" class="section">
      <h2>Booking Constraints</h2>
      <div class="service-grid">
        <article v-for="rule in bookingConstraints" :key="rule.id || rule.code" class="service-card">
          <h3>{{ rule.title }}</h3>
          <p><strong>Code:</strong> {{ rule.code }}</p>
          <p>{{ rule.description }}</p>
          <p><strong>Applies to:</strong> {{ rule.appliesToRole }}</p>
          <p><strong>Value:</strong> {{ rule.value }}</p>
          <RouterLink :to="{ path: `/home-feature/constraint/${rule.id}` }">View details</RouterLink>
        </article>
      </div>
    </section>

    <section id="doctors" class="section">
      <h2>Find Doctor</h2>
      <form class="search-form" @submit.prevent="searchDoctors">
        <input v-model="search.query" type="text" placeholder="Doctor name" />
        <input v-model="search.specialty" type="text" placeholder="Specialty" />
        <button type="submit">Search</button>
      </form>
      <div class="doctor-list">
        <article v-for="doctor in doctors" :key="doctor.id || doctor.doctorId" class="doctor-card">
          <h3>{{ doctor.fullName || doctor.name }}</h3>
          <p>{{ doctor.specialization || doctor.specialty }}</p>
          <RouterLink :to="{ path: '/doctors', query: { query: doctor.fullName || doctor.name } }">View doctor</RouterLink>
        </article>
      </div>
    </section>

    <section id="news" class="section">
      <h2>News</h2>
      <div class="news-row">
        <article v-for="news in newsItems" :key="news.title" class="news-card">
          <small>{{ news.date }}</small>
          <h3>{{ news.title }}</h3>
          <p>{{ news.summary }}</p>
          <RouterLink :to="{ path: `/home-feature/news/${news.id}` }">Read more</RouterLink>
        </article>
      </div>
    </section>

    <section id="contact" class="section">
      <h2>Contact</h2>
      <div class="contact-grid">
        <form class="contact-form" @submit.prevent="sendContact">
          <input v-model="contact.fullName" type="text" placeholder="Full name" required />
          <input v-model="contact.phone" type="text" placeholder="Phone" required />
          <input v-model="contact.email" type="email" placeholder="Email" />
          <textarea v-model="contact.message" rows="4" placeholder="Message" required></textarea>
          <button type="submit">Send request</button>
        </form>

        <form class="contact-form" @submit.prevent="loadSlots">
          <h3>Check available slots</h3>
          <input v-model="slotForm.doctorId" type="text" placeholder="Doctor ID" required />
          <input v-model="slotForm.from" type="date" />
          <input v-model="slotForm.to" type="date" />
          <button type="submit">Get slots</button>
          <pre>{{ pretty(slots) }}</pre>
        </form>
      </div>
    </section>

    <section v-if="publicInfo" class="section">
      <h2>Public Data</h2>
      <pre>{{ pretty(publicInfo) }}</pre>
    </section>

    <p v-if="status" class="status ok">{{ status }}</p>
    <p v-if="error" class="status err">{{ error }}</p>

  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { guestApi } from '../services/api.js';

const publicInfo = ref(null);
const doctors = ref([]);
const slots = ref(null);
const status = ref('');
const error = ref('');
const insurancePlans = ref([]);
const bookingConstraints = ref([]);

const tickerItems = [
  { id: 'medical-services', label: '24/7 Emergency Service' },
  { id: 'find-doctor', label: 'Online Appointment Available' },
  { id: 'appointment', label: 'Insurance Support' },
  { id: 'question', label: 'New Pediatric Center Opened' },
  { id: 'home-care', label: 'Free Screening Week' },
];

const fallbackServices = [
  { id: 'svc-fallback-1', title: 'General Checkup', description: 'Routine health examination and consultation.', detailRoute: '/home-feature/service/svc-fallback-1' },
  { id: 'svc-fallback-2', title: 'Cardiology', description: 'Heart and vascular disease diagnosis and treatment.', detailRoute: '/home-feature/service/svc-fallback-2' },
  { id: 'svc-fallback-3', title: 'Laboratory', description: 'Blood tests, diagnostics, and clinical analysis.', detailRoute: '/home-feature/service/svc-fallback-3' },
  { id: 'svc-fallback-4', title: 'Emergency', description: 'Immediate care for urgent medical cases.', detailRoute: '/home-feature/service/svc-fallback-4' },
  { id: 'svc-fallback-5', title: 'Maternity', description: 'Pregnancy monitoring and childbirth support.', detailRoute: '/home-feature/service/svc-fallback-5' },
  { id: 'svc-fallback-6', title: 'Pediatrics', description: 'Healthcare services for infants and children.', detailRoute: '/home-feature/service/svc-fallback-6' },
];

const services = ref([...fallbackServices]);
const fallbackInsurancePlans = [
  {
    id: 'ins-fallback-1',
    provider: 'Community Health',
    planName: 'Basic Care',
    coverageSummary: 'Covers outpatient consultation and selected diagnostics.',
    copayAmount: 20,
  },
];
const fallbackBookingConstraints = [
  {
    id: 'bc-fallback-1',
    code: 'MAX_ACTIVE_APPOINTMENTS',
    title: 'Active booking limit',
    description: 'Each patient can hold a limited number of active appointments.',
    appliesToRole: 'patient',
    value: 3,
  },
];

insurancePlans.value = [...fallbackInsurancePlans];
bookingConstraints.value = [...fallbackBookingConstraints];

const newsItems = [
  { id: 'outpatient-expand', date: '2026-03-24', title: 'Hospital expands outpatient service', summary: 'New counters and faster check-in are now available.' },
  { id: 'new-specialists', date: '2026-03-20', title: 'New specialist doctors joined', summary: 'Three specialists in cardiology and pediatrics joined this month.' },
  { id: 'online-queue', date: '2026-03-15', title: 'Online queue pilot launched', summary: 'Patients can now monitor waiting queue from home.' },
];

const search = reactive({ query: '', specialty: '' });
const slotForm = reactive({ doctorId: '', from: '', to: '' });
const contact = reactive({ fullName: '', phone: '', email: '', message: '' });

const pretty = (value) => (value ? JSON.stringify(value, null, 2) : 'No data yet.');

const safeRun = async (fn) => {
  error.value = '';
  status.value = '';
  try {
    await fn();
  } catch (e) {
    error.value = e.message || 'Request failed';
  }
};

const loadPublicInfo = () =>
  safeRun(async () => {
    publicInfo.value = await guestApi.publicInfo();
    const mapped = (publicInfo.value?.services || []).map((svc) => ({
      id: svc.id,
      title: svc.name || svc.title || 'Service',
      description: svc.description || 'Service available via clinic management workflow.',
      price: svc.price,
      detailRoute: svc.id ? `/services/${svc.id}` : '/home-feature/service/unknown',
    }));
    if (mapped.length > 0) {
      services.value = mapped;
    }

    const mappedPlans = (publicInfo.value?.insurancePlans || []).map((plan) => ({
      id: plan.id,
      provider: plan.provider || 'Unknown provider',
      planName: plan.planName || 'Insurance Plan',
      coverageSummary: plan.coverageSummary || 'Coverage details are available at check-in.',
      copayAmount: plan.copayAmount ?? 0,
    }));
    insurancePlans.value = mappedPlans.length > 0 ? mappedPlans : [...fallbackInsurancePlans];

    const mappedConstraints = (publicInfo.value?.bookingConstraints || []).map((rule) => ({
      id: rule.id,
      code: rule.code || 'UNKNOWN_RULE',
      title: rule.title || 'Booking Rule',
      description: rule.description || 'Please contact reception for booking requirements.',
      appliesToRole: rule.appliesToRole || 'patient',
      value: rule.value ?? '-',
    }));
    bookingConstraints.value = mappedConstraints.length > 0 ? mappedConstraints : [...fallbackBookingConstraints];
  });

const searchDoctors = () =>
  safeRun(async () => {
    const response = await guestApi.searchDoctors(search);
    doctors.value = response.doctors || [];
  });

const loadSlots = () =>
  safeRun(async () => {
    slots.value = await guestApi.availableSlots(slotForm.doctorId, {
      from: slotForm.from,
      to: slotForm.to,
    });
  });

const sendContact = () =>
  safeRun(async () => {
    await guestApi.contact(contact);
    status.value = 'Contact request submitted.';
  });

onMounted(() => {
  loadPublicInfo();
  searchDoctors();
});
</script>

<style scoped>
.home {
  width: 100%;
  margin: 0 auto;
  color: #1f2937;
}

.banner-actions a,
.banner-actions button,
.search-form button,
.contact-form button {
  border: 1px solid #9ca3af;
  background: #f9fafb;
  padding: 10px 14px;
  color: #111827;
  text-decoration: none;
}

.banner {
  margin-top: 24px;
  background: linear-gradient(90deg, #dbeafe, #f0f9ff);
  border: 1px solid #93c5fd;
  padding: 30px;
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr auto;
}

.banner-label {
  margin: 0;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #1d4ed8;
}

.banner h1 {
  margin: 14px 0;
  font-size: 30px;
}

.ticker-wrap {
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid #d1d5db;
  background: #f9fafb;
}

.ticker-track {
  display: inline-flex;
  gap: 38px;
  padding: 14px 24px;
  min-width: 100%;
  animation: slide 22s linear infinite;
}

.ticker-item {
  color: #1f2937;
  text-decoration: none;
  border-bottom: 1px dashed #93c5fd;
}

.section {
  margin-top: 24px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 28px;
}

.service-grid {
  margin-top: 16px;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.service-card,
.doctor-card,
.news-card {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 18px;
}

.search-form {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr auto;
}

.search-form input,
.contact-form input,
.contact-form textarea {
  border: 1px solid #9ca3af;
  padding: 10px 12px;
  width: 100%;
}

.doctor-list {
  margin-top: 16px;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.news-row {
  margin-top: 16px;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.contact-grid {
  margin-top: 16px;
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr;
}

.contact-form {
  display: grid;
  gap: 14px;
}

.contact-form pre,
.section pre {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 12px;
  max-height: 250px;
  overflow: auto;
}

.status {
  margin-top: 24px;
  border: 1px solid #d1d5db;
  padding: 12px 14px;
}

.status.ok {
  background: #ecfdf5;
  border-color: #6ee7b7;
}

.status.err {
  background: #fef2f2;
  border-color: #fca5a5;
}

@keyframes slide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (max-width: 900px) {
  .banner,
  .contact-grid,
  .search-form {
    grid-template-columns: 1fr;
  }
}
</style>
