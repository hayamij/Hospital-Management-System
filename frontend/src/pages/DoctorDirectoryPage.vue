<template>
  <div class="directory-page">
    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <h1>Danh ba bac si</h1>
          <p>Tim bac si theo ten va loc nhanh theo chuyen khoa de xem lich kham phu hop.</p>
        </div>
        <img
          class="hero-image"
          src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80"
          alt="Doi ngu bac si tai benh vien"
          loading="lazy"
        />
      </div>

      <form class="toolbar" @submit.prevent="searchDoctors">
        <label class="field">
          <span>Tim theo ten</span>
          <input
            v-model.trim="filters.query"
            type="text"
            placeholder="Nhap ten bac si"
            autocomplete="off"
          />
        </label>

        <label class="field">
          <span>Loc theo chuyen khoa</span>
          <select v-model="filters.specialty">
            <option value="">Tat ca chuyen khoa</option>
            <option v-for="item in specialtyOptions" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </label>

        <div class="actions">
          <button type="submit">Tim kiem</button>
          <button type="button" class="ghost" @click="resetFilters">Dat lai</button>
        </div>
      </form>
    </header>

    <section class="panel">
      <p v-if="loading" class="message">Dang tai danh sach bac si...</p>
      <p v-else-if="error" class="message err">{{ error }}</p>
      <p v-else-if="displayDoctors.length === 0" class="message">Khong tim thay bac si phu hop.</p>

      <div v-else class="cards">
        <article v-for="doctor in displayDoctors" :key="doctor.id" class="doctor-card">
          <div class="doctor-card-head">
            <img
              class="avatar"
              :src="doctor.avatar"
              :alt="`Anh dai dien ${doctor.name}`"
              loading="lazy"
            />

            <div class="info">
              <p class="doctor-label">Bac si chuyen khoa</p>
              <h2>{{ doctor.name }}</h2>
              <p class="specialty">{{ doctor.specialty || 'Chuyen khoa chung' }}</p>
            </div>
          </div>

          <div class="doctor-meta-row">
            <span class="meta-pill">Kham ngoai tru</span>
            <span class="meta-pill">Tu van truc tiep</span>
          </div>

          <div class="doctor-actions">
            <RouterLink class="btn-link" :to="`/patient/booking?doctor=${encodeURIComponent(doctor.id)}`">
              Dat lich ngay
            </RouterLink>
            <RouterLink class="btn-link ghost" :to="`/public-card/doctors/${encodeURIComponent(doctor.id)}`">
              Xem ho so
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { guestApi } from '../services/api.js';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const doctors = ref([]);

const filters = reactive({
  query: '',
  specialty: '',
});

const fallbackDoctors = [
  { id: 'doc-1', name: 'Dr. Demo', specialty: 'Noi tong quat' },
  { id: 'doc-2', name: 'Dr. Nguyen Minh', specialty: 'Tim mach' },
  { id: 'doc-3', name: 'Dr. Tran Lan', specialty: 'Nhi khoa' },
  { id: 'doc-4', name: 'Dr. Hoang Vu', specialty: 'Da lieu' },
  { id: 'doc-5', name: 'Dr. Pham An', specialty: 'Tai mui hong' },
  { id: 'doc-6', name: 'Dr. Le Khoa', specialty: 'Than kinh' },
];

const toAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E2E8F0&color=0F172A`;

const normalizeDoctor = (source, index = 0) => {
  const id = source?.id || source?.doctorId || `doctor-${index + 1}`;
  const name = source?.fullName || source?.name || `Bac si ${index + 1}`;
  const specialty = source?.specialization || source?.specialty || '';

  return {
    id,
    name,
    specialty,
    avatar: source?.avatarUrl || source?.avatar || toAvatar(name),
  };
};

const specialtyOptions = computed(() => {
  const set = new Set();
  for (const doctor of doctors.value) {
    if (doctor.specialty) set.add(doctor.specialty);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
});

const displayDoctors = computed(() => {
  const keyword = filters.query.trim().toLowerCase();
  const selectedSpecialty = filters.specialty.trim().toLowerCase();

  return doctors.value.filter((doctor) => {
    const name = doctor.name.toLowerCase();
    const specialty = (doctor.specialty || '').toLowerCase();

    const matchName = !keyword || name.includes(keyword);
    const matchSpecialty = !selectedSpecialty || specialty === selectedSpecialty;
    return matchName && matchSpecialty;
  });
});

const searchDoctors = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await guestApi.searchDoctors({
      query: filters.query,
      specialty: filters.specialty,
    });

    const list = Array.isArray(response?.doctors) ? response.doctors : [];
    if (list.length > 0) {
      doctors.value = list.map(normalizeDoctor);
      return;
    }

    doctors.value = fallbackDoctors.map(normalizeDoctor);
  } catch (e) {
    doctors.value = fallbackDoctors.map(normalizeDoctor);
    error.value = e?.message || 'Khong the tai danh sach bac si tu he thong.';
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.query = '';
  filters.specialty = '';
};

onMounted(() => {
  const initialSpecialty = String(route.query.specialty || '').trim();
  if (initialSpecialty) {
    filters.specialty = initialSpecialty;
  }
  searchDoctors();
});
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
