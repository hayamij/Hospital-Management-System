<template>
  <div class="services-page">
    <header class="hero panel">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">CHƯƠNG TRÌNH CHĂM SÓC</p>
          <h1>Danh mục dịch vụ y tế theo nhu cầu điều trị</h1>
          <p>
            Tìm kiếm nhanh theo tên dịch vụ, lọc theo nhóm chuyên khoa và xem các gói khám
            nổi bật được đặt lịch nhiều trong tuần.
          </p>

          <div class="hero-actions">
            <RouterLink to="/register" class="hero-link primary">Bắt đầu đặt lịch</RouterLink>
            <RouterLink to="/doctors" class="hero-link secondary">Xem danh bạ bác sĩ</RouterLink>
          </div>
        </div>

        <div class="hero-media" aria-hidden="true">
          <img class="main-shot" src="/assets/images/hospital2.png" alt="" loading="lazy" />
          <img class="sub-shot top" src="/assets/images/doctor-image.png" alt="" loading="lazy" />
          <img class="sub-shot bottom" src="/assets/images/room2.png" alt="" loading="lazy" />
        </div>
      </div>
    </header>

    <section class="filters panel">
      <div class="field search-col">
        <label for="service-search">Tìm theo tên dịch vụ</label>
        <input
          id="service-search"
          :value="searchText"
          type="text"
          placeholder="Ví dụ: Khám tim mạch"
          @input="$emit('update:searchText', $event.target.value)"
        />
      </div>

      <div class="field">
        <label for="service-group">Nhóm dịch vụ</label>
        <select
          id="service-group"
          :value="categoryFilter"
          @change="$emit('update:categoryFilter', $event.target.value)"
        >
          <option value="all">Tất cả nhóm</option>
          <option v-for="group in categoryOptions" :key="group" :value="group">{{ group }}</option>
        </select>
      </div>

      <div class="field stat-box">
        <p>Tổng dịch vụ</p>
        <strong>{{ filteredServices.length }}</strong>
      </div>
    </section>

    <section class="panel spotlight" v-if="featuredServices.length > 0">
      <header class="spotlight-head">
        <h2>Gói dịch vụ nổi bật</h2>
        <p>Lựa chọn được bệnh nhân đặt lịch nhiều nhất trong hệ thống.</p>
      </header>

      <div class="spotlight-grid">
        <RouterLink
          v-for="service in featuredServices"
          :key="`featured-${service.id}`"
          :to="`/services/${service.id}`"
          class="spotlight-link"
        >
          <article class="spotlight-card">
            <img :src="service.image" :alt="`Hình minh họa dịch vụ ${service.name}`" loading="lazy" />
            <div class="spotlight-body">
              <p class="category-chip">{{ service.category }}</p>
              <h3>{{ service.name }}</h3>
              <p>{{ service.description || 'Thông tin đang được cập nhật.' }}</p>
              <p class="price" v-if="service.price !== null && service.price !== undefined">
                Giá tham khảo: {{ formatPrice(service.price) }}
              </p>
            </div>
          </article>
        </RouterLink>
      </div>
    </section>

    <section class="panel catalog">
      <p v-if="loading" class="msg">Đang tải danh sách dịch vụ...</p>
      <p v-else-if="error" class="msg err">{{ error }}</p>

      <div v-else class="service-grid">
        <RouterLink
          v-for="service in filteredServices"
          :key="service.id"
          :to="`/services/${service.id}`"
          class="card-link"
        >
          <article class="service-card">
            <div class="thumb-wrap">
              <img class="service-thumb" :src="service.image" :alt="`Hình minh họa dịch vụ ${service.name}`" loading="lazy" />
              <p class="category-chip">{{ service.category }}</p>
            </div>
            <h2>{{ service.name }}</h2>
            <p class="desc">{{ service.description || 'Thông tin đang được cập nhật.' }}</p>
            <p class="price" v-if="service.price !== null && service.price !== undefined">
              Giá tham khảo: {{ formatPrice(service.price) }}
            </p>
            <span class="see-detail">Xem chi tiết</span>
          </article>
        </RouterLink>
      </div>

      <p v-if="!loading && !error && filteredServices.length === 0" class="msg">
        Chưa có dịch vụ để hiển thị.
      </p>
    </section>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, required: true },
  error: { type: String, default: '' },
  searchText: { type: String, required: true },
  categoryFilter: { type: String, required: true },
  categoryOptions: { type: Array, required: true },
  filteredServices: { type: Array, required: true },
  featuredServices: { type: Array, required: true },
  formatPrice: { type: Function, required: true },
});

defineEmits(['update:searchText', 'update:categoryFilter']);
</script>

<style scoped>
.services-page {
  display: grid;
  gap: 22px;
}

.hero {
  border: 1px solid #cbd5e1;
  background:
    radial-gradient(1200px 260px at -10% -20%, rgba(186, 230, 253, 0.65) 0%, rgba(255, 255, 255, 0) 60%),
    linear-gradient(110deg, #f8fafc 0%, #eef2ff 45%, #e2e8f0 100%);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 1fr);
  gap: 26px;
  align-items: center;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0f766e;
}

.hero-copy h1 {
  margin: 10px 0 0;
  font-size: 40px;
  line-height: 1.15;
  color: #0f172a;
}

.hero-copy p {
  margin: 14px 0 0;
  max-width: 620px;
  color: #334155;
}

.hero-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid #0f172a;
  text-decoration: none;
  color: #0f172a;
  font-weight: 600;
}

.hero-link.primary {
  background: #0f172a;
  color: #f8fafc;
}

.hero-media {
  position: relative;
  min-height: 260px;
}

.hero-media img {
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.main-shot {
  width: 100%;
  height: 300px;
}

.sub-shot {
  position: absolute;
  width: 140px;
  height: 94px;
  right: -12px;
  background: #fff;
}

.sub-shot.top {
  top: -14px;
}

.sub-shot.bottom {
  bottom: -14px;
}

.filters {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr) minmax(160px, 0.7fr);
  gap: 14px;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
}

.field label {
  font-size: 13px;
  color: #334155;
}

.field input,
.field select {
  min-height: 40px;
  border: 1px solid #cbd5e1;
  padding: 0 10px;
  background: #fff;
}

.stat-box {
  border: 1px dashed #94a3b8;
  background: #f8fafc;
  min-height: 40px;
  padding: 8px 10px;
}

.stat-box p {
  margin: 0;
  font-size: 12px;
  color: #475569;
}

.stat-box strong {
  font-size: 22px;
  line-height: 1.1;
  color: #0f172a;
}

.spotlight {
  border: 1px solid #cbd5e1;
  background: linear-gradient(130deg, #f8fafc 0%, #f1f5f9 100%);
}

.spotlight-head h2 {
  margin: 0;
}

.spotlight-head p {
  margin: 8px 0 0;
  color: #475569;
}

.spotlight-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.spotlight-link,
.card-link {
  text-decoration: none;
  color: inherit;
}

.spotlight-card {
  border: 1px solid #dbeafe;
  background: #fff;
  display: grid;
  grid-template-rows: 150px 1fr;
  min-height: 100%;
}

.spotlight-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight-body {
  padding: 12px;
  display: grid;
  gap: 8px;
}

.spotlight-body h3 {
  margin: 0;
}

.spotlight-body p {
  margin: 0;
  color: #334155;
}

.catalog {
  border: 1px solid #e2e8f0;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.service-card {
  border: 1px solid #dbeafe;
  background: #fff;
  padding: 10px;
  display: grid;
  gap: 10px;
  min-height: 100%;
}

.thumb-wrap {
  position: relative;
}

.service-thumb {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.category-chip {
  display: inline-block;
  width: fit-content;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #cbd5e1;
}

.thumb-wrap .category-chip {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #f8fafc;
}

.service-card h2 {
  margin: 0;
  font-size: 20px;
}

.desc,
.price {
  margin: 0;
  color: #334155;
}

.see-detail {
  margin-top: auto;
  font-weight: 600;
  color: #0f172a;
}

.msg {
  margin: 0;
  color: #475569;
}

.msg.err {
  color: #b91c1c;
}

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-media {
    min-height: auto;
  }

  .main-shot {
    height: 230px;
  }

  .sub-shot {
    display: none;
  }

  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
