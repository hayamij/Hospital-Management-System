<template>
  <div class="about-page">
    <header class="hero panel">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">About Us</p>
          <h1>Lich su hinh thanh va phat trien</h1>
          <p class="lead">
            Benh vien duoc xay dung voi muc tieu mang den dich vu y te chuyen nghiep,
            de tiep can va dat nguoi benh lam trung tam.
          </p>
        </div>
        <img class="hero-image" src="/assets/images/doctor-image.png" alt="Bac si cham soc benh nhan cao tuoi" loading="lazy" />
      </div>
    </header>

    <section class="panel content-grid">
      <article class="prose">
        <h2>Lich su hinh thanh</h2>
        <p>
          Khoi dau tu mot phong kham quy mo nho nam 2008, benh vien da mo rong
          he thong kham ngoai tru, can lam sang va dieu tri noi tru qua nhieu giai doan.
        </p>
        <p>
          Tu nam 2018, chung toi day manh chuyen doi so, toi uu quy trinh tiep don,
          quan ly ho so benh an va dat lich kham truc tuyen.
        </p>

        <h2>Tam nhin</h2>
        <p>
          Tro thanh he thong cham soc suc khoe duoc tin cay hang dau tai khu vuc,
          ket hop chat luong dieu tri, dao duc nghe nghiep va trai nghiem benh nhan hien dai.
        </p>

        <h2>Su menh</h2>
        <p>
          Cung cap dich vu y te an toan, minh bach va lien tuc cai tien,
          dong thoi tao moi truong phat trien ben vung cho doi ngu y bac si.
        </p>
      </article>

      <aside class="sidebar">
        <section class="meta-card">
          <h3>Thong tin nhanh</h3>
          <ul>
            <li>Thanh lap: 2008</li>
            <li>Chuyen khoa: {{ metrics.specialties }}</li>
            <li>Dich vu dang van hanh: {{ metrics.services }}</li>
            <li>He thong ho tro 24/7</li>
          </ul>
        </section>

        <section class="meta-card">
          <h3>Doi ngu lanh dao</h3>
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
    name: 'BS. Nguyen Hoang Minh',
    role: 'Giam doc dieu hanh',
    focus: 'Quan tri van hanh va nang cao chat luong kham chua benh.',
  },
  {
    name: 'TS. Tran Thu Ha',
    role: 'Giam doc chuyen mon',
    focus: 'Phat trien huong dieu tri dua tren bang chung y hoc.',
  },
  {
    name: 'ThS. Le Quang Phuoc',
    role: 'Giam doc cong nghe va du lieu',
    focus: 'Trien khai he thong so va bao mat du lieu y te.',
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
