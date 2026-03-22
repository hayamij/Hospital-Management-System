<template>
  <aside class="side-bar">
    <div class="side-bar__title">Navigation</div>
    <nav class="side-bar__links">
      <RouterLink to="/dashboard">Dashboard</RouterLink>
      <RouterLink to="/appointments">Appointments</RouterLink>
      <RouterLink to="/patients">Patients</RouterLink>
      <RouterLink to="/doctors">Doctors</RouterLink>
      <RouterLink to="/medical-records">Medical Records</RouterLink>
      <RouterLink to="/billing">Billing</RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.side-bar {
  width: 220px;
  padding: 1rem;
  background: #0b1021;
  color: #e2e8f0;
  min-height: calc(100vh - 56px);
}

.side-bar__title {
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.side-bar__links {
  display: grid;
  gap: 0.5rem;
}

a {
  color: #e2e8f0;
  text-decoration: none;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  background: #11182f;
  border: 1px solid #1e293b;
}

a.router-link-active {
  background: #2563eb;
  border-color: #2563eb;
}
</style>
