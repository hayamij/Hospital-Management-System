<template>
  <div class="feature-page">
    <p class="back-link-wrap"><RouterLink class="back-link" to="/">← Quay về trang chủ</RouterLink></p>

    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">{{ group.toUpperCase() }}</p>
          <h1>{{ view.title }}</h1>
          <p class="subtitle">{{ view.subtitle }}</p>
          <p class="description">{{ view.description }}</p>
          <div class="hero-actions">
            <RouterLink class="btn primary" :to="primaryCta.to">{{ primaryCta.label }}</RouterLink>
            <RouterLink class="btn" to="/public">Mở cổng thông tin công khai</RouterLink>
          </div>
        </div>
        <img :src="heroImage" :alt="`Hình minh họa ${view.title}`" loading="lazy" />
      </div>
    </header>

    <section class="panel meta-panel">
      <div class="meta-item">
        <span>Nhóm</span>
        <strong>{{ group }}</strong>
      </div>
      <div class="meta-item">
        <span>Mã</span>
        <strong>{{ id }}</strong>
      </div>
      <div class="meta-item">
        <span>Bước tiếp theo</span>
        <strong>{{ primaryCta.label }}</strong>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const group = computed(() => String(route.params.group || 'feature'));
const id = computed(() => String(route.params.id || 'unknown'));

const imageByGroup = {
  news: '/assets/images/banner2.png',
  step: '/assets/images/hospital2.png',
  insurance: '/assets/images/room.png',
  constraint: '/assets/images/hospital.png',
};

const catalog = {
  step: {
    'medical-services': {
      title: 'Dịch vụ y tế',
      subtitle: 'Khám phá các dịch vụ y tế dành cho bệnh nhân.',
      description: 'Giới thiệu các dịch vụ y tế cốt lõi và quy trình khám ngoại trú.',
    },
    'find-doctor': {
      title: 'Tìm bác sĩ',
      subtitle: 'Tìm theo chuyên khoa và kinh nghiệm.',
      description: 'Sử dụng bộ lọc để chọn đúng bác sĩ nhanh chóng.',
    },
    appointment: {
      title: 'Đặt lịch khám',
      subtitle: 'Bắt đầu từ khung giờ trống và bác sĩ phù hợp.',
      description: 'Luồng đặt lịch hỗ trợ xem lịch bác sĩ và điều kiện đặt lịch.',
    },
    question: {
      title: 'Gửi câu hỏi',
      subtitle: 'Nhận hỗ trợ trước khi đăng ký.',
      description: 'Gửi yêu cầu liên hệ về chuyên khoa, bảo hiểm và chuẩn bị khám.',
    },
    'home-care': {
      title: 'Chăm sóc tại nhà',
      subtitle: 'Lộ trình chăm sóc từ xa.',
      description: 'Dịch vụ tại nhà gồm theo dõi sau khám và hướng dẫn từ điều dưỡng.',
    },
  },
  insurance: {},
  constraint: {},
  news: {
    'outpatient-expand': {
      title: 'Mở rộng khu khám ngoại trú',
      subtitle: 'Tăng năng lực phục vụ mỗi ngày.',
      description: 'Bổ sung quầy tiếp nhận và quy trình nhanh hơn giúp giảm thời gian chờ.',
    },
    'new-specialists': {
      title: 'Thêm bác sĩ chuyên khoa',
      subtitle: 'Mở rộng chuyên môn ở các khoa trọng điểm.',
      description: 'Bổ sung chuyên gia giúp nâng cao chất lượng chẩn đoán và điều trị.',
    },
    'online-queue': {
      title: 'Thử nghiệm xếp hàng trực tuyến',
      subtitle: 'Theo dõi thứ tự khám từ xa.',
      description: 'Người bệnh có thể xem thứ tự trước khi đến bệnh viện.',
    },
  },
};

const defaultView = {
  title: 'Chi tiết tính năng',
  subtitle: 'Trang chi tiết tính năng trên trang chủ.',
  description: 'Tính năng này hiển thị trong luồng điều hướng trang chủ.',
};

const view = computed(() => {
  const groupMap = catalog[group.value] || {};
  return groupMap[id.value] || {
    ...defaultView,
    title: `Chi tiết ${group.value}`,
  };
});

const heroImage = computed(() => imageByGroup[group.value] || '/assets/images/image.png');

const primaryCta = computed(() => {
  if (group.value === 'news') return { label: 'Đặt lịch khám', to: '/patient/booking' };
  if (group.value === 'step' && id.value === 'find-doctor') return { label: 'Tìm bác sĩ ngay', to: '/doctors' };
  if (group.value === 'step' && id.value === 'medical-services') return { label: 'Xem dịch vụ', to: '/services' };
  return { label: 'Bắt đầu đặt lịch', to: '/patient/booking' };
});
</script>

<style scoped>
.feature-page {
  display: grid;
  gap: 20px;
}

.back-link-wrap {
  margin: 0;
}

.back-link {
  text-decoration: none;
  color: #1e293b;
  border-bottom: 1px solid #94a3b8;
}

.hero {
  background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.hero-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 1fr);
  align-items: center;
}

.hero-grid img {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border: 1px solid #fed7aa;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}

.hero h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.subtitle {
  margin: 10px 0 0;
  color: #334155;
}

.description {
  margin: 10px 0 0;
  color: #334155;
  line-height: 1.7;
}

.hero-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  min-height: 42px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.btn.primary {
  border-color: #ea580c;
  background: #ea580c;
  color: #ffffff;
}

.meta-panel {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.meta-item {
  border: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 12px;
}

.meta-item span {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.meta-item strong {
  color: #0f172a;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
