<template>
  <div class="services-page">
    <header class="hero panel">
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">CARE PROGRAMS</p>
          <h1>Danh muc dich vu y te theo nhu cau dieu tri</h1>
          <p>
            Tim kiem nhanh theo ten dich vu, loc theo nhom chuyen khoa, va xem cac goi kham
            noi bat duoc dat lich nhieu trong tuan.
          </p>

          <div class="hero-actions">
            <RouterLink to="/register" class="hero-link primary">Bat dau dat lich</RouterLink>
            <RouterLink to="/doctors" class="hero-link secondary">Xem danh ba bac si</RouterLink>
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
        <label for="service-search">Tim theo ten dich vu</label>
        <input id="service-search" v-model.trim="searchText" type="text" placeholder="Vi du: Kham tim mach" />
      </div>

      <div class="field">
        <label for="service-group">Nhom dich vu</label>
        <select id="service-group" v-model="categoryFilter">
          <option value="all">Tat ca nhom</option>
          <option v-for="group in categoryOptions" :key="group" :value="group">{{ group }}</option>
        </select>
      </div>

      <div class="field stat-box">
        <p>Tong dich vu</p>
        <strong>{{ filteredServices.length }}</strong>
      </div>
    </section>

    <section class="panel spotlight" v-if="featuredServices.length > 0">
      <header class="spotlight-head">
        <h2>Goi dich vu noi bat</h2>
        <p>Lua chon duoc benh nhan dat lich nhieu nhat trong he thong.</p>
      </header>

      <div class="spotlight-grid">
        <RouterLink
          v-for="service in featuredServices"
          :key="`featured-${service.id}`"
          :to="`/services/${service.id}`"
          class="spotlight-link"
        >
          <article class="spotlight-card">
            <img :src="service.image" :alt="`Hinh minh hoa dich vu ${service.name}`" loading="lazy" />
            <div class="spotlight-body">
              <p class="category-chip">{{ service.category }}</p>
              <h3>{{ service.name }}</h3>
              <p>{{ service.description || 'Thong tin dang duoc cap nhat.' }}</p>
              <p class="price" v-if="service.price !== null && service.price !== undefined">
                Gia tham khao: {{ formatPrice(service.price) }}
              </p>
            </div>
          </article>
        </RouterLink>
      </div>
    </section>

    <section class="panel catalog">
      <p v-if="loading" class="msg">Dang tai danh sach dich vu...</p>
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
              <img class="service-thumb" :src="service.image" :alt="`Hinh minh hoa dich vu ${service.name}`" loading="lazy" />
              <p class="category-chip">{{ service.category }}</p>
            </div>
            <h2>{{ service.name }}</h2>
            <p class="desc">{{ service.description || 'Thong tin dang duoc cap nhat.' }}</p>
            <p class="price" v-if="service.price !== null && service.price !== undefined">
              Gia tham khao: {{ formatPrice(service.price) }}
            </p>
            <span class="see-detail">Xem chi tiet</span>
          </article>
        </RouterLink>
      </div>

      <p v-if="!loading && !error && filteredServices.length === 0" class="msg">
        Chua co dich vu de hien thi.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { guestApi } from '../services/api.js';

const services = ref([]);
const loading = ref(false);
const error = ref('');
const searchText = ref('');
const categoryFilter = ref('all');
const serviceImages = [
  '/assets/images/banner2.png',
  '/assets/images/hospital.png',
  '/assets/images/hospital2.png',
  '/assets/images/room.png',
  '/assets/images/room2.png',
  '/assets/images/doctor-image.png',
  '/assets/images/image.png',
];

const fallbackServices = [
  {
    id: 'svc-fallback-1',
    name: 'Kham tong quat',
    category: 'Tong quat',
    description: 'Kham suc khoe dinh ky va tu van tong quan.',
    price: 300000,
  },
  {
    id: 'svc-fallback-2',
    name: 'Kham tim mach',
    category: 'Noi khoa',
    description: 'Tam soat va theo doi benh ly tim mach pho bien.',
    price: 450000,
  },
  {
    id: 'svc-fallback-3',
    name: 'Kham nhi khoa',
    category: 'Nhi khoa',
    description: 'Cham soc suc khoe cho tre em theo tung do tuoi.',
    price: 350000,
  },
  {
    id: 'svc-fallback-4',
    name: 'Xet nghiem tong hop',
    category: 'Can lam sang',
    description: 'Goi xet nghiem co ban phuc vu chan doan ban dau.',
    price: 500000,
  },
];

const categoryByName = (name = '') => {
  const text = String(name).toLowerCase();
  if (text.includes('tim mach') || text.includes('noi')) return 'Noi khoa';
  if (text.includes('nhi')) return 'Nhi khoa';
  if (text.includes('xet nghiem') || text.includes('chan doan')) return 'Can lam sang';
  if (text.includes('ngoai') || text.includes('phau thuat')) return 'Ngoai khoa';
  return 'Tong quat';
};

const categoryOptions = computed(() => {
  const groups = new Set(services.value.map((item) => item.category).filter(Boolean));
  return Array.from(groups).sort((a, b) => a.localeCompare(b));
});

const filteredServices = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  return services.value.filter((item) => {
    const inCategory = categoryFilter.value === 'all' || item.category === categoryFilter.value;
    if (!inCategory) return false;
    if (!q) return true;
    const name = item.name.toLowerCase();
    const description = String(item.description || '').toLowerCase();
    const category = String(item.category || '').toLowerCase();
    return name.includes(q) || description.includes(q) || category.includes(q);
  });
});

const featuredServices = computed(() => filteredServices.value.slice(0, 3));

const formatPrice = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `${amount.toLocaleString('vi-VN')} VND`;
};

const loadServices = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await guestApi.publicInfo();
    const apiServices = Array.isArray(response?.services) ? response.services : [];

    if (apiServices.length > 0) {
      services.value = apiServices.map((item, index) => ({
        id: item?.id || `service-${index + 1}`,
        name: item?.name || item?.title || 'Dich vu',
        category: item?.category || categoryByName(item?.name || item?.title || ''),
        description: item?.description || '',
        price: item?.price ?? null,
        image: serviceImages[index % serviceImages.length],
      }));
      return;
    }

    services.value = fallbackServices.map((item, index) => ({
      ...item,
      category: item.category || categoryByName(item.name),
      image: serviceImages[index % serviceImages.length],
    }));
  } catch (e) {
    services.value = fallbackServices.map((item, index) => ({
      ...item,
      category: item.category || categoryByName(item.name),
      image: serviceImages[index % serviceImages.length],
    }));
    error.value = e?.message || 'Khong the tai danh sach dich vu tu he thong.';
  } finally {
    loading.value = false;
  }
};

onMounted(loadServices);
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
  font-size: 38px;
  line-height: 1.15;
  color: #0f172a;
}

.hero-copy p {
  margin: 14px 0 0;
  max-width: 60ch;
  color: #334155;
  line-height: 1.7;
}

.hero-actions {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-link {
  min-height: 44px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border: 1px solid #334155;
  font-weight: 600;
}

.hero-link.primary {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.hero-link.secondary {
  background: #ffffff;
  color: #0f172a;
}

.hero-media {
  min-height: 340px;
  display: grid;
  grid-template-columns: 1.2fr 0.9fr;
  gap: 10px;
}

.hero-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.main-shot {
  grid-row: 1 / span 2;
}

.sub-shot {
  max-height: 165px;
}

.filters {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr) minmax(140px, 0.5fr);
  gap: 14px;
  align-items: end;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-size: 13px;
  color: #475569;
}

.search-col {
  min-width: 0;
}

.stat-box {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  padding: 8px 12px;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-box p {
  margin: 0;
  font-size: 12px;
  color: #475569;
}

.stat-box strong {
  margin-top: 2px;
  font-size: 28px;
  line-height: 1;
  color: #0f172a;
}

.spotlight {
  background: linear-gradient(160deg, #ffffff 0%, #f8fafc 100%);
}

.spotlight-head h2 {
  margin: 0;
  font-size: 28px;
}

.spotlight-head p {
  margin: 8px 0 0;
  color: #475569;
}

.spotlight-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.spotlight-link {
  text-decoration: none;
  color: inherit;
}

.spotlight-card {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  height: 100%;
}

.spotlight-card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.spotlight-body {
  padding: 14px;
}

.spotlight-body .category-chip {
  position: static;
  left: auto;
  top: auto;
  margin: 0 0 8px;
}

.spotlight-body h3 {
  margin: 8px 0;
  font-size: 21px;
  color: #0f172a;
}

.spotlight-body p {
  margin: 0;
  color: #334155;
  line-height: 1.6;
}

.service-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card-link {
  color: inherit;
  text-decoration: none;
}

.service-card {
  border: 1px solid #dbe2ea;
  background: #ffffff;
  padding: 16px;
  height: 100%;
  display: grid;
  gap: 10px;
}

.thumb-wrap {
  position: relative;
}

.service-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  display: block;
}

.category-chip {
  margin: 0;
  display: inline-flex;
  position: absolute;
  left: 10px;
  top: 10px;
  height: 28px;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.92);
}

.service-card h2 {
  margin: 2px 0 0;
  font-size: 22px;
  color: #0f172a;
}

.desc {
  margin: 0;
  color: #334155;
  line-height: 1.65;
}

.price {
  margin-top: 2px !important;
  color: #0f766e !important;
  font-weight: 600;
}

.see-detail {
  margin-top: auto;
  color: #1d4ed8;
  font-weight: 600;
  font-size: 14px;
}

.msg {
  margin: 0;
}

.msg.err {
  color: #b91c1c;
}

@media (max-width: 1200px) {
  .hero-copy h1 {
    font-size: 33px;
  }

  .spotlight-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-media {
    min-height: auto;
    grid-template-columns: 1fr 1fr;
  }

  .main-shot {
    grid-row: auto;
    grid-column: 1 / -1;
    max-height: 280px;
  }

  .sub-shot {
    max-height: 150px;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .stat-box {
    min-height: 90px;
  }

  .spotlight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
