<template>
  <div class="home">
    <section class="hero-top-banner">
      <img src="/assets/images/banner1.png" alt="Y bac si dang thao tac trong phong mo" loading="eager" />
    </section>

    <section class="hero-banner">
      <div class="hero-content">
        <p class="hero-tag">Cham soc suc khoe toan dien</p>
        <h1>Dat lich kham nhanh, dung bac si, dung chuyen khoa</h1>
        <p>
          He thong benh vien so giup ban tim bac si, xem chuyen khoa noi bat
          va cap nhat thong bao moi nhat trong vai thao tac.
        </p>
        <div class="hero-content-actions">
          <RouterLink class="cta-primary" to="/patient/booking">Đặt lịch ngay</RouterLink>
          <RouterLink class="cta-secondary" to="/doctors">Xem danh sach bac si</RouterLink>
        </div>
      </div>
    </section>

    <section class="section visual-row">
      <article class="visual-card">
        <img src="/assets/images/hospital.png" alt="Bac si tu van benh nhan cao tuoi" loading="lazy" />
        <div>
          <h3>Tu van than thien</h3>
          <p>Doi ngu bac si luon dong hanh va giai thich ro rang cho benh nhan.</p>
        </div>
      </article>

      <article class="visual-card">
        <img src="/assets/images/room.png" alt="Khu dieu tri benh vien sach se" loading="lazy" />
        <div>
          <h3>Khong gian hien dai</h3>
          <p>Khu dieu tri va can lam sang duoc bo tri toi uu cho quy trinh kham nhanh.</p>
        </div>
      </article>

      <article class="visual-card">
        <img src="/assets/images/room2.png" alt="Phong cap cuu voi day du giuong benh" loading="lazy" />
        <div>
          <h3>San sang 24/7</h3>
          <p>Nang luc tiep nhan cap cuu lien tuc, dam bao phan tuyen va xu tri kip thoi.</p>
        </div>
      </article>
    </section>

    <section class="section">
      <header class="section-head">
        <h2>Quick Search</h2>
        <p>Tim nhanh bac si theo ten hoac chuyen khoa.</p>
      </header>

      <form class="quick-search" @submit.prevent="searchDoctors">
        <input v-model="search.query" type="text" placeholder="Nhap ten bac si" />
        <input v-model="search.specialty" type="text" placeholder="Nhap chuyen khoa" />
        <button type="submit">Tim kiem</button>
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
            <p>{{ doctor.specialization || doctor.specialty || 'General' }}</p>
          </article>
        </RouterLink>
      </div>
    </section>

    <section class="section">
      <header class="section-head">
        <h2>Chuyen khoa noi bat</h2>
        <p>Danh sach fallback se duoc thay bang API khi backend hoan thien.</p>
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
        <h2>Tin tuc / Thong bao moi nhat</h2>
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
  { id: 'doc-1', fullName: 'Dr. Demo', specialization: 'Noi tong quat' },
  { id: 'doc-2', fullName: 'Dr. Alice', specialization: 'Tim mach' },
  { id: 'doc-3', fullName: 'Dr. Minh', specialization: 'Nhi khoa' },
];

const fallbackSpecialties = [
  { id: 'sp-1', name: 'Noi tong quat', summary: 'Kham tong quat, tam soat va theo doi suc khoe dinh ky.' },
  { id: 'sp-2', name: 'Tim mach', summary: 'Chan doan va dieu tri cac van de tim mach pho bien.' },
  { id: 'sp-3', name: 'Nhi khoa', summary: 'Cham soc suc khoe toan dien cho tre em moi lua tuoi.' },
  { id: 'sp-4', name: 'San phu khoa', summary: 'Dong hanh cung suc khoe phu nu va thai ky an toan.' },
  { id: 'sp-5', name: 'Xet nghiem', summary: 'Ho tro chan doan nhanh voi he thong xet nghiem hien dai.' },
  { id: 'sp-6', name: 'Cap cuu', summary: 'Xu ly tinh huong khan cap 24/7 voi doi ngu truc lien tuc.' },
];

const doctors = ref([]);
const specialties = ref([...fallbackSpecialties]);
const error = ref('');

const newsItems = [
  { id: 'outpatient-expand', date: '2026-03-24', title: 'Mo rong khu kham ngoai tru', summary: 'Tang so quay tiep nhan va toi uu thoi gian cho cua benh nhan.' },
  { id: 'new-specialists', date: '2026-03-20', title: 'Bo sung doi ngu bac si chuyen khoa', summary: 'Them bac si tim mach, nhi khoa va noi tong quat tuan nay.' },
  { id: 'online-queue', date: '2026-03-15', title: 'Ra mat thong bao hang doi truc tuyen', summary: 'Nguoi benh co the theo doi thu tu kham ngay tren he thong.' },
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
    error.value = e.message || 'Khong the tai du lieu tu he thong.';
  }
};

const hydrateSpecialties = () =>
  safeRun(async () => {
    const info = await guestApi.publicInfo();
    const mapped = (info?.services || []).map((svc) => ({
      id: svc.id || `sp-${svc.name || 'unknown'}`,
      name: svc.name || 'Chuyen khoa',
      summary: svc.description || 'Thong tin chuyen khoa dang duoc cap nhat.',
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
