<template>
  <div class="directory-page">
    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <h1>Danh bạ bác sĩ</h1>
          <p>Tìm bác sĩ theo tên và lọc nhanh theo chuyên khoa để xem lịch khám phù hợp.</p>
        </div>
        <img
          class="hero-image"
          src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80"
          alt="Đội ngũ bác sĩ tại bệnh viện"
          loading="lazy"
        />
      </div>

      <form class="toolbar" @submit.prevent="$emit('submit')">
        <label class="field">
          <span>Tìm theo tên</span>
          <input
            :value="query"
            type="text"
            placeholder="Nhập tên bác sĩ"
            autocomplete="off"
            @input="$emit('update:query', $event.target.value)"
          />
        </label>

        <label class="field">
          <span>Lọc theo chuyên khoa</span>
          <select :value="specialty" @change="$emit('update:specialty', $event.target.value)">
            <option value="">Tất cả chuyên khoa</option>
            <option v-for="item in specialtyOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>

        <div class="actions">
          <button type="submit">Tìm kiếm</button>
          <button type="button" class="ghost" @click="$emit('reset')">Đặt lại</button>
        </div>
      </form>
    </header>

    <section class="panel">
      <p v-if="loading" class="message">Đang tải danh sách bác sĩ...</p>
      <p v-else-if="error" class="message err">{{ error }}</p>
      <p v-else-if="displayDoctors.length === 0" class="message">Không tìm thấy bác sĩ phù hợp.</p>

      <div v-else class="cards">
        <article v-for="doctor in displayDoctors" :key="doctor.id" class="doctor-card">
          <div class="doctor-card-head">
            <img
              class="avatar"
              :src="doctor.avatar"
              :alt="`Ảnh đại diện ${doctor.name}`"
              loading="lazy"
            />

            <div class="info">
              <p class="doctor-label">Bác sĩ chuyên khoa</p>
              <h2>{{ doctor.name }}</h2>
              <p class="specialty">{{ doctor.specialty || 'Chuyên khoa chung' }}</p>
            </div>
          </div>

          <div class="doctor-meta-row">
            <span class="meta-pill">Khám ngoại trú</span>
            <span class="meta-pill">Tư vấn trực tiếp</span>
          </div>

          <div class="doctor-actions">
            <RouterLink class="btn-link" :to="`/patient/booking?doctor=${encodeURIComponent(doctor.id)}`">
              Đặt lịch ngay
            </RouterLink>
            <RouterLink class="btn-link ghost" :to="`/public-card/doctors/${encodeURIComponent(doctor.id)}`">
              Xem hồ sơ
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  query: { type: String, default: '' },
  specialty: { type: String, default: '' },
  specialtyOptions: { type: Array, default: () => [] },
  displayDoctors: { type: Array, default: () => [] },
});

defineEmits(['submit', 'reset', 'update:query', 'update:specialty']);
</script>

<style scoped>
.directory-page {
  display: grid;
  gap: 20px;
}

.panel {
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 22px;
}

.hero {
  background: linear-gradient(115deg, #f8fafc 0%, #eef2ff 100%);
}

.hero-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
  align-items: center;
}

.hero-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.hero h1 {
  margin: 0;
}

.hero p {
  margin: 10px 0 0;
  color: #334155;
}

.toolbar {
  margin-top: 18px;
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr auto;
  align-items: end;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  font-size: 13px;
  color: #334155;
}

.field input,
.field select {
  width: 100%;
}

.actions {
  display: flex;
  gap: 10px;
}

button.ghost {
  background: #f8fafc;
}

.cards {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.doctor-card {
  border: 1px solid #d8e2ee;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
  display: grid;
  gap: 14px;
}

.doctor-card-head {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.doctor-label {
  margin: 0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
}

.info h2 {
  margin: 6px 0 0;
  font-size: 20px;
  color: #0f172a;
}

.specialty {
  margin: 8px 0 0;
  color: #334155;
}

.doctor-meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-pill {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  line-height: 1;
  padding: 7px 9px;
}

.doctor-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-link {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
  text-decoration: none;
}

.btn-link.ghost {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

.message {
  margin: 0;
}

.message.err {
  color: #b91c1c;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-image {
    height: 190px;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .actions {
    width: 100%;
  }

  .actions button {
    flex: 1;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .doctor-actions {
    width: 100%;
  }

  .doctor-actions .btn-link {
    flex: 1;
  }
}
</style>
