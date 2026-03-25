<template>
  <div class="page">
    <header class="panel">
      <h1>Public Portal</h1>
      <p>Guest functions: browse public info, search doctors, view slots, and submit contact form.</p>
      <div class="row">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/register">Register</RouterLink>
      </div>
    </header>

    <section class="grid two-col">
      <article class="panel">
        <h2>Public information</h2>
        <button type="button" @click="loadPublicInfo">Load public data</button>
        <pre class="pre">{{ pretty(publicInfo) }}</pre>
      </article>

      <article class="panel">
        <h2>Guest doctor search</h2>
        <form class="grid three" @submit.prevent="searchDoctors">
          <input v-model="search.query" placeholder="Doctor name" />
          <input v-model="search.specialty" placeholder="Specialty" />
          <button type="submit">Search</button>
        </form>
        <ul class="list">
          <li v-for="d in doctors" :key="d.id || d.doctorId" class="item">
            <p><strong>{{ d.fullName || d.name }}</strong></p>
            <p>{{ d.specialization || d.specialty }}</p>
          </li>
        </ul>
      </article>
    </section>

    <section class="grid two-col">
      <article class="panel">
        <h2>Check available slots</h2>
        <form class="grid three" @submit.prevent="loadSlots">
          <input v-model="slotForm.doctorId" required placeholder="Doctor ID" />
          <input v-model="slotForm.from" type="date" />
          <input v-model="slotForm.to" type="date" />
          <button type="submit">Get slots</button>
        </form>
        <pre class="pre">{{ pretty(slots) }}</pre>
      </article>

      <article class="panel">
        <h2>Start registration</h2>
        <form class="grid" @submit.prevent="startRegistration">
          <input v-model="registration.fullName" required placeholder="Full name" />
          <input v-model="registration.email" type="email" required placeholder="Email" />
          <input v-model="registration.phone" required placeholder="Phone" />
          <button type="submit">Start registration</button>
        </form>
      </article>

      <article class="panel">
        <h2>Contact clinic</h2>
        <form class="grid" @submit.prevent="sendContact">
          <input v-model="contact.fullName" required placeholder="Full name" />
          <input v-model="contact.phone" required placeholder="Phone" />
          <input v-model="contact.email" type="email" placeholder="Email" />
          <textarea v-model="contact.message" required rows="4" placeholder="Your message"></textarea>
          <button type="submit">Submit contact form</button>
        </form>
      </article>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { guestApi } from '../services/api.js';

const publicInfo = ref(null);
const doctors = ref([]);
const slots = ref(null);
const status = ref('');
const error = ref('');

const search = reactive({ query: '', specialty: '' });
const slotForm = reactive({ doctorId: '', from: '', to: '' });
const registration = reactive({ fullName: '', email: '', phone: '' });
const contact = reactive({ fullName: '', phone: '', email: '', message: '' });

const pretty = (value) => (value ? JSON.stringify(value, null, 2) : 'No data loaded yet.');

const loadPublicInfo = async () => {
  error.value = '';
  publicInfo.value = await guestApi.publicInfo();
};

const searchDoctors = async () => {
  error.value = '';
  const response = await guestApi.searchDoctors(search);
  doctors.value = response.doctors || [];
};

const loadSlots = async () => {
  error.value = '';
  slots.value = await guestApi.availableSlots(slotForm.doctorId, { from: slotForm.from, to: slotForm.to });
};

const startRegistration = async () => {
  error.value = '';
  status.value = '';
  await guestApi.startRegistration(registration);
  status.value = 'Registration request received successfully.';
};

const sendContact = async () => {
  error.value = '';
  status.value = '';
  await guestApi.contact(contact);
  status.value = 'Contact request sent successfully.';
};
</script>

<style scoped>
.row a { text-decoration: none; color: #111827; }
.two-col { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.list { margin: 14px 0 0; padding-left: 22px; }
.item { margin: 10px 0; }
.pre { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; max-height: 300px; overflow: auto; }
</style>
