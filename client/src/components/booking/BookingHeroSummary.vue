<template>
  <header class="panel hero">
    <div class="hero-grid">
      <div>
        <p class="eyebrow">Đặt lịch nhiều bước</p>
        <h1>Đặt lịch khám theo 4 bước thông minh</h1>
        <p>Chọn chuyên khoa, bác sĩ, khung giờ, triệu chứng và xác nhận lịch hẹn.</p>
        <div class="context-chips" v-if="selectedDoctorFromQuery || selectedServiceName">
          <span v-if="selectedDoctorFromQuery" class="chip">Đã chọn bác sĩ: {{ selectedDoctorFromQuery }}</span>
          <span v-if="selectedServiceName" class="chip">Đã chọn dịch vụ: {{ selectedServiceName }}</span>
        </div>
      </div>

      <aside class="hero-side">
        <p class="hero-side-title">Tóm tắt đặt lịch</p>
        <p><strong>Chuyên khoa:</strong> {{ form.specialty || 'Chưa chọn' }}</p>
        <p><strong>Bác sĩ:</strong> {{ selectedDoctor?.name || 'Chưa chọn' }}</p>
        <p><strong>Ngày:</strong> {{ form.appointmentDate || 'Chưa chọn' }}</p>
      </aside>
    </div>
  </header>
</template>

<script setup>
defineProps({
  selectedDoctorFromQuery: { type: String, default: '' },
  selectedServiceName: { type: String, default: '' },
  form: { type: Object, required: true },
  selectedDoctor: { type: Object, default: null },
});
</script>

<style scoped>
.hero {
  background: linear-gradient(120deg, #eef2ff 0%, #f8fafc 100%);
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #3730a3;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 32px;
}

.hero p {
  margin: 10px 0 0;
  color: #334155;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  gap: 16px;
  align-items: start;
}

.context-chips {
  margin-top: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.85);
  color: #334155;
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 6px 9px;
}

.hero-side {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 12px;
}

.hero-side-title {
  margin: 0 0 8px;
  font-weight: 700;
  color: #0f172a;
}

.hero-side p {
  margin: 0 0 6px;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
