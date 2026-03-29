<template>
  <section class="section">
    <header class="section-head">
      <h2>Tìm nhanh bác sĩ</h2>
      <p>Tìm nhanh bác sĩ theo tên hoặc chuyên khoa.</p>
    </header>

    <form class="quick-search" @submit.prevent="$emit('search')">
      <input :value="search.query" type="text" placeholder="Nhập tên bác sĩ" @input="$emit('update:query', $event.target.value)" />
      <input :value="search.specialty" type="text" placeholder="Nhập chuyên khoa" @input="$emit('update:specialty', $event.target.value)" />
      <button type="submit">Tìm kiếm</button>
    </form>

    <div class="doctor-list">
      <RouterLink
        v-for="doctor in doctors"
        :key="doctor.id || doctor.doctorId"
        :to="doctor.id || doctor.doctorId
          ? { path: `/public-card/doctors/${doctor.id || doctor.doctorId}` }
          : { path: '/doctors', query: { query: doctor.fullName || doctor.name } }"
        class="card-link"
      >
        <article class="doctor-card">
          <h3>{{ doctor.fullName || doctor.name }}</h3>
          <p>{{ doctor.specialization || doctor.specialty || 'Nội tổng quát' }}</p>
        </article>
      </RouterLink>
    </div>
  </section>

  <section class="section">
    <header class="section-head">
      <h2>Chuyên khoa nổi bật</h2>
      <p>Danh sách tạm sẽ được thay bằng API khi backend hoàn thiện.</p>
    </header>

    <div class="specialty-grid">
      <RouterLink
        v-for="item in specialties"
        :key="item.id"
        :to="specialtyLink(item)"
        class="card-link specialty-link"
      >
        <article class="specialty-card">
          <h3>{{ item.name }}</h3>
          <p>{{ item.summary }}</p>
        </article>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
defineProps({
  search: { type: Object, required: true },
  doctors: { type: Array, default: () => [] },
  specialties: { type: Array, default: () => [] },
  specialtyLink: { type: Function, required: true },
});

defineEmits(['search', 'update:query', 'update:specialty']);
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

.section-head p {
  margin: 8px 0 0;
  color: #475569;
}

.quick-search {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr auto;
}

.quick-search input {
  width: 100%;
}

.doctor-list {
  margin-top: 18px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.doctor-card {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 18px;
}

.specialty-grid {
  margin-top: 18px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.specialty-card {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  padding: 18px;
  min-height: 148px;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.specialty-card h3 {
  margin: 0 0 8px;
}

.specialty-card p {
  margin: 0;
  color: #334155;
}

.specialty-link:hover .specialty-card,
.specialty-link:focus-visible .specialty-card {
  transform: translateY(-2px);
  border-color: #60a5fa;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.12);
}

.card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

@media (max-width: 900px) {
  .quick-search {
    grid-template-columns: 1fr;
  }
}
</style>
