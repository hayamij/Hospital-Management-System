<template>
  <div class="page">
    <header class="panel">
      <h1>{{ view.title }}</h1>
      <p>{{ view.subtitle }}</p>
      <div class="row">
        <RouterLink to="/">Back to home</RouterLink>
        <RouterLink to="/public">Open public portal</RouterLink>
      </div>
    </header>

    <section class="panel">
      <h2>Details</h2>
      <p>{{ view.description }}</p>
      <p><strong>Group:</strong> {{ group }}</p>
      <p><strong>ID:</strong> {{ id }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const group = computed(() => String(route.params.group || 'feature'));
const id = computed(() => String(route.params.id || 'unknown'));

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
</script>

<style scoped>
.row a {
  color: #111827;
  text-decoration: none;
}
</style>
