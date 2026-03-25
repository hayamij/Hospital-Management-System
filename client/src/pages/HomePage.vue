<template>
  <div class="home">
    <section class="hero-top-banner">
      <img src="/assets/images/banner1.png" alt="Y bác sĩ đang thao tác trong phòng mổ" loading="eager" />
    </section>

    <section class="hero-banner">
      <div class="hero-content">
        <p class="hero-tag">Chăm sóc sức khỏe toàn diện</p>
        <h1>Đặt lịch khám nhanh, đúng bác sĩ, đúng chuyên khoa</h1>
        <p>
          Hệ thống bệnh viện số giúp bạn tìm bác sĩ, xem chuyên khoa nổi bật
          và cập nhật thông báo mới nhất trong vài thao tác.
        </p>
        <div class="hero-content-actions">
          <RouterLink class="cta-primary" to="/patient/booking">Đặt lịch ngay</RouterLink>
          <RouterLink class="cta-secondary" to="/doctors">Xem danh sách bác sĩ</RouterLink>
        </div>
      </div>
    </section>

    <section class="section visual-row">
      <article class="visual-card">
        <img src="/assets/images/hospital.png" alt="Bác sĩ tư vấn bệnh nhân cao tuổi" loading="lazy" />
        <div>
          <h3>Tư vấn thân thiện</h3>
          <p>Đội ngũ bác sĩ luôn đồng hành và giải thích rõ ràng cho bệnh nhân.</p>
        </div>
      </article>

      <article class="visual-card">
        <img src="/assets/images/room.png" alt="Khu điều trị bệnh viện sạch sẽ" loading="lazy" />
        <div>
          <h3>Không gian hiện đại</h3>
          <p>Khu điều trị và cận lâm sàng được bố trí tối ưu cho quy trình khám nhanh.</p>
        </div>
      </article>

      <article class="visual-card">
        <img src="/assets/images/room2.png" alt="Phòng cấp cứu với đầy đủ giường bệnh" loading="lazy" />
        <div>
          <h3>Sẵn sàng 24/7</h3>
          <p>Năng lực tiếp nhận cấp cứu liên tục, đảm bảo phân tuyến và xử trí kịp thời.</p>
        </div>
      </article>
    </section>

    <section class="section">
      <header class="section-head">
        <h2>Tìm nhanh bác sĩ</h2>
        <p>Tìm nhanh bác sĩ theo tên hoặc chuyên khoa.</p>
      </header>

      <form class="quick-search" @submit.prevent="searchDoctors">
        <input v-model="search.query" type="text" placeholder="Nhập tên bác sĩ" />
        <input v-model="search.specialty" type="text" placeholder="Nhập chuyên khoa" />
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

    <section class="section">
      <header class="section-head">
        <h2>Tin tức / Thông báo mới nhất</h2>
      </header>

      <div class="news-row">
        <RouterLink
          v-for="news in newsItems"
          :key="news.id"
          :to="{ path: `/home-feature/news/${news.id}` }"
          class="card-link"
        >
          <article class="news-card">
            <small>{{ news.date }}</small>
            <h3>{{ news.title }}</h3>
            <p>{{ news.summary }}</p>
          </article>
        </RouterLink>
      </div>
    </section>

    <p v-if="error" class="status err">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { guestApi } from '../services/api.js';

const fallbackDoctors = [
  { id: 'doc-1', fullName: 'BS. Minh họa', specialization: 'Nội tổng quát' },
  { id: 'doc-2', fullName: 'BS. Alice', specialization: 'Tim mạch' },
  { id: 'doc-3', fullName: 'BS. Minh', specialization: 'Nhi khoa' },
];

const fallbackSpecialties = [
  { id: 'sp-1', name: 'Nội tổng quát', summary: 'Khám tổng quát, tầm soát và theo dõi sức khỏe định kỳ.' },
  { id: 'sp-2', name: 'Tim mạch', summary: 'Chẩn đoán và điều trị các vấn đề tim mạch phổ biến.' },
  { id: 'sp-3', name: 'Nhi khoa', summary: 'Chăm sóc sức khỏe toàn diện cho trẻ em mọi lứa tuổi.' },
  { id: 'sp-4', name: 'Sản phụ khoa', summary: 'Đồng hành cùng sức khỏe phụ nữ và thai kỳ an toàn.' },
  { id: 'sp-5', name: 'Xét nghiệm', summary: 'Hỗ trợ chẩn đoán nhanh với hệ thống xét nghiệm hiện đại.' },
  { id: 'sp-6', name: 'Cấp cứu', summary: 'Xử lý tình huống khẩn cấp 24/7 với đội ngũ trực liên tục.' },
];

const doctors = ref([]);
const specialties = ref([...fallbackSpecialties]);
const error = ref('');

const newsItems = [
  { id: 'outpatient-expand', date: '2026-03-24', title: 'Mở rộng khu khám ngoại trú', summary: 'Tăng số quầy tiếp nhận và tối ưu thời gian chờ của bệnh nhân.' },
  { id: 'new-specialists', date: '2026-03-20', title: 'Bổ sung đội ngũ bác sĩ chuyên khoa', summary: 'Thêm bác sĩ tim mạch, nhi khoa và nội tổng quát tuần này.' },
  { id: 'online-queue', date: '2026-03-15', title: 'Ra mắt thông báo hàng đợi trực tuyến', summary: 'Người bệnh có thể theo dõi thứ tự khám ngay trên hệ thống.' },
];

const search = reactive({ query: '', specialty: '' });

const specialtyLink = (item) => ({
  path: '/doctors',
  query: { specialty: item?.name || '' },
});

const safeRun = async (fn) => {
  error.value = '';
  try {
    await fn();
  } catch (e) {
    error.value = e.message || 'Không thể tải dữ liệu từ hệ thống.';
  }
};

const hydrateSpecialties = () =>
  safeRun(async () => {
    const info = await guestApi.publicInfo();
    const mapped = (info?.services || []).map((svc) => ({
      id: svc.id || `sp-${svc.name || 'unknown'}`,
      name: svc.name || 'Chuyên khoa',
      summary: svc.description || 'Thông tin chuyên khoa đang được cập nhật.',
    }));

    if (mapped.length > 0) {
      specialties.value = mapped;
    }
  });

const searchDoctors = () =>
  safeRun(async () => {
    const response = await guestApi.searchDoctors(search);
    doctors.value = (response?.doctors && response.doctors.length > 0)
      ? response.doctors
      : [...fallbackDoctors];
  });

onMounted(() => {
  doctors.value = [...fallbackDoctors];
  hydrateSpecialties();
  searchDoctors();
});
</script>

<style scoped>
.home {
  width: 100%;
  margin: 0 auto;
  color: #1f2937;
  display: grid;
  gap: 18px;
}

.hero-top-banner {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  min-height: 580px;
  background: #0f172a;
  overflow: hidden;
}

.hero-top-banner img {
  width: 100%;
  height: 100%;
  min-height: 580px;
  object-fit: cover;
  display: block;
  filter: saturate(1.04) contrast(1.03);
}

.hero-banner {
  margin-top: 0;
  padding: 26px 34px 34px;
  border: 1px solid #93c5fd;
  background: linear-gradient(120deg, #eff6ff 0%, #f8fbff 100%);
}

.hero-content {
  display: grid;
  gap: 14px;
}

.hero-tag {
  margin: 0;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #1d4ed8;
}

.hero-content h1 {
  margin: 0;
  max-width: 760px;
  font-size: 34px;
  line-height: 1.2;
}

.hero-content p {
  margin: 0;
  max-width: 860px;
  color: #334155;
}

.hero-content-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cta-primary,
.cta-secondary {
  min-width: 172px;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #0f172a;
  padding: 0 14px;
  box-sizing: border-box;
}

.cta-primary {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: #ffffff;
}

.cta-secondary {
  background: #ffffff;
  border-color: #cbd5e1;
}

.section {
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 28px;
}

.visual-row {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.visual-card {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  display: grid;
  grid-template-rows: 170px auto;
}

.visual-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.visual-card div {
  padding: 14px;
}

.visual-card h3 {
  margin: 0 0 8px;
}

.visual-card p {
  margin: 0;
  color: #334155;
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

.doctor-card,
.news-card {
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

.news-row {
  margin-top: 18px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.status {
  margin-top: 0;
  border: 1px solid #d1d5db;
  padding: 12px 14px;
}

.status.err {
  background: #fef2f2;
  border-color: #fca5a5;
}

@media (max-width: 900px) {
  .hero-top-banner {
    min-height: 300px;
  }

  .hero-top-banner img {
    min-height: 300px;
  }

  .hero-content-actions {
    gap: 8px;
  }

  .visual-row {
    grid-template-columns: 1fr;
  }

  .quick-search {
    grid-template-columns: 1fr;
  }
}
</style>
