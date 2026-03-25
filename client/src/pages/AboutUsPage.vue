<template>
  <div class="about-page">
    <header class="hero panel">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">Về chúng tôi</p>
          <h1>Lịch sử hình thành và phát triển</h1>
          <p class="lead">
            Bệnh viện được xây dựng với mục tiêu mang đến dịch vụ y tế chuyên nghiệp,
            dễ tiếp cận và đặt người bệnh làm trung tâm.
          </p>
        </div>
        <img class="hero-image" src="/assets/images/doctor-image.png" alt="Bác sĩ chăm sóc bệnh nhân cao tuổi" loading="lazy" />
      </div>
    </header>

    <section class="panel content-grid">
      <article class="prose">
        <h2>Lịch sử hình thành</h2>
        <p>
          Khởi đầu từ một phòng khám quy mô nhỏ năm 2008, bệnh viện đã mở rộng
          hệ thống khám ngoại trú, cận lâm sàng và điều trị nội trú qua nhiều giai đoạn.
        </p>
        <p>
          Từ năm 2018, chúng tôi đẩy mạnh chuyển đổi số, tối ưu quy trình tiếp đón,
          quản lý hồ sơ bệnh án và đặt lịch khám trực tuyến.
        </p>

        <h2>Tầm nhìn</h2>
        <p>
          Trở thành hệ thống chăm sóc sức khỏe được tin cậy hàng đầu tại khu vực,
          kết hợp chất lượng điều trị, đạo đức nghề nghiệp và trải nghiệm bệnh nhân hiện đại.
        </p>

        <h2>Sứ mệnh</h2>
        <p>
          Cung cấp dịch vụ y tế an toàn, minh bạch và liên tục cải tiến,
          đồng thời tạo môi trường phát triển bền vững cho đội ngũ y bác sĩ.
        </p>
      </article>

      <aside class="sidebar">
        <section class="meta-card">
          <h3>Thông tin nhanh</h3>
          <ul>
            <li>Thành lập: 2008</li>
            <li>Chuyên khoa: {{ metrics.specialties }}</li>
            <li>Dịch vụ đang vận hành: {{ metrics.services }}</li>
            <li>Hệ thống hỗ trợ 24/7</li>
          </ul>
        </section>

        <section class="meta-card">
          <h3>Đội ngũ lãnh đạo</h3>
          <div v-for="leader in leadership" :key="leader.name" class="leader-item">
            <p class="leader-name">{{ leader.name }}</p>
            <p>{{ leader.role }}</p>
            <p class="muted">{{ leader.focus }}</p>
          </div>
        </section>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { guestApi } from '../services/api.js';

const leadership = [
  {
    name: 'BS. Nguyễn Hoàng Minh',
    role: 'Giám đốc điều hành',
    focus: 'Quản trị vận hành và nâng cao chất lượng khám chữa bệnh.',
  },
  {
    name: 'TS. Trần Thu Hà',
    role: 'Giám đốc chuyên môn',
    focus: 'Phát triển hướng điều trị dựa trên bằng chứng y học.',
  },
  {
    name: 'ThS. Lê Quang Phước',
    role: 'Giám đốc công nghệ và dữ liệu',
    focus: 'Triển khai hệ thống số và bảo mật dữ liệu y tế.',
  },
];

const metrics = reactive({
  specialties: 12,
  services: 40,
});

const loadMetrics = async () => {
  try {
    const response = await guestApi.publicInfo();
    const services = Array.isArray(response?.services) ? response.services.length : 0;
    if (services > 0) {
      metrics.services = services;
      metrics.specialties = Math.max(6, Math.min(services, 24));
    }
  } catch {
    // Keep fallback metrics when API is unavailable.
  }
};

onMounted(loadMetrics);
</script>

<style scoped>
.about-page {
  display: grid;
  gap: 20px;
}

.hero {
  background: linear-gradient(120deg, #eff6ff 0%, #f8fafc 100%);
}

.hero-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
  align-items: center;
}

.hero-image {
  width: 100%;
  min-height: 200px;
  max-height: 280px;
  object-fit: cover;
  border: 1px solid #bfdbfe;
  background: #ffffff;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #1d4ed8;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 34px;
  line-height: 1.2;
}

.lead {
  margin: 12px 0 0;
  max-width: 760px;
  color: #334155;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 22px;
}

.prose h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.prose p {
  margin: 0 0 14px;
  color: #334155;
  line-height: 1.7;
}

.sidebar {
  display: grid;
  gap: 14px;
  align-content: start;
}

.meta-card {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 16px;
}

.meta-card h3 {
  margin: 0 0 10px;
}

.meta-card ul {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.6;
}

.leader-item + .leader-item {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #dbe2ea;
}

.leader-name {
  margin: 0;
  font-weight: 700;
}

.muted {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
