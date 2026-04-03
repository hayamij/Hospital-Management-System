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

    <SlidingPager
      :items="doctors"
      :items-per-page="3"
      :mobile-items-per-page="1"
      empty-text="Không tìm thấy bác sĩ phù hợp với bộ lọc hiện tại."
    >
      <template #default="{ item: doctor }">
        <RouterLink
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
      </template>
    </SlidingPager>
  </section>

  <section class="section">
    <header class="section-head">
      <h2>Chuyên khoa nổi bật</h2>
      <p>Danh sách tạm sẽ được thay bằng API khi backend hoàn thiện.</p>
    </header>

    <SlidingPager
      :items="specialties"
      :items-per-page="3"
      :mobile-items-per-page="1"
      empty-text="Danh sách chuyên khoa đang được cập nhật."
    >
      <template #default="{ item }">
        <RouterLink
          :to="specialtyLink(item)"
          class="card-link specialty-link"
        >
          <article class="specialty-card">
            <h3>{{ item.name }}</h3>
            <p>{{ item.summary }}</p>
          </article>
        </RouterLink>
      </template>
    </SlidingPager>
  </section>
</template>

<script setup>
import SlidingPager from '../../shared/SlidingPager.vue';

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

.doctor-card {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 18px;
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
  height: 100%;
}

.doctor-card,
.specialty-card {
  height: 100%;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .quick-search {
    grid-template-columns: 1fr;
  }
}
</style>
