<template>
  <div class="news-page">
    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">Newsroom</p>
          <h1>Tin tuc y khoa va thong bao</h1>
          <p class="lead">
            Cap nhat kien thuc y khoa, thong bao van hanh va cac chuong trinh cham soc cong dong.
          </p>
        </div>
        <img
          class="hero-cover"
          src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80"
          alt="Benh vien hien dai"
          loading="lazy"
        />
      </div>
    </header>

    <section class="panel layout">
      <main>
        <article v-for="post in visiblePosts" :key="post.id" class="post-card">
          <img class="post-cover" :src="post.image" :alt="`Minh hoa tin tuc ${post.title}`" loading="lazy" />
          <p class="meta">{{ post.date }} · {{ post.category }}</p>
          <h2>{{ post.title }}</h2>
          <p class="excerpt">{{ post.excerpt }}</p>
          <RouterLink class="read-more" :to="`/home-feature/news/${post.id}`">Doc tiep</RouterLink>
        </article>

        <p v-if="!loading && visiblePosts.length === 0" class="empty">Chua co bai viet phu hop bo loc.</p>
      </main>

      <aside class="sidebar">
        <section class="widget">
          <h3>Loc bai viet</h3>
          <input
            v-model.trim="keyword"
            type="text"
            placeholder="Tim theo tieu de"
            aria-label="Tim theo tieu de"
          />
          <select v-model="selectedCategory" aria-label="Loc theo danh muc">
            <option value="">Tat ca danh muc</option>
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>
        </section>

        <section class="widget">
          <h3>Thong bao nhanh</h3>
          <ul>
            <li>Kham tong quat giam tai 20% cho lich dat online truoc 48 gio.</li>
            <li>Trung tam xet nghiem mo rong khung gio den 20:30 hang ngay.</li>
            <li>Duong day tu van 24/7: 1900 3493.</li>
          </ul>
        </section>
      </aside>
    </section>

    <p v-if="loading" class="msg">Dang tai bai viet...</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { guestApi } from '../services/api.js';

const loading = ref(false);
const error = ref('');
const keyword = ref('');
const selectedCategory = ref('');
const newsImages = [
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1400&q=80',
];

const fallbackPosts = [
  {
    id: 'outpatient-expand',
    date: '2026-03-24',
    category: 'Thong bao',
    title: 'Mo rong khu kham ngoai tru',
    excerpt: 'Tang so quay tiep nhan va toi uu thoi gian cho cua benh nhan.',
    image: newsImages[0],
  },
  {
    id: 'new-specialists',
    date: '2026-03-20',
    category: 'Y khoa',
    title: 'Bo sung doi ngu bac si chuyen khoa',
    excerpt: 'Them bac si tim mach, nhi khoa va noi tong quat trong quy nay.',
    image: newsImages[1],
  },
  {
    id: 'online-queue',
    date: '2026-03-15',
    category: 'Cong nghe',
    title: 'Thong bao hang doi truc tuyen duoc trien khai',
    excerpt: 'Nguoi benh co the theo doi thu tu kham ngay tren he thong.',
    image: newsImages[2],
  },
  {
    id: 'community-campaign',
    date: '2026-03-10',
    category: 'Cong dong',
    title: 'Chuoi tu van suc khoe cong dong thang 3',
    excerpt: 'Hoat dong tu van mien phi cho nguoi cao tuoi tai 4 diem dan cu.',
    image: newsImages[3],
  },
];

const posts = ref([...fallbackPosts]);

const categories = computed(() => {
  const set = new Set(posts.value.map((item) => item.category));
  return Array.from(set);
});

const visiblePosts = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  const c = selectedCategory.value.trim().toLowerCase();

  return posts.value.filter((post) => {
    const title = post.title.toLowerCase();
    const category = post.category.toLowerCase();
    const byKeyword = !k || title.includes(k);
    const byCategory = !c || category === c;
    return byKeyword && byCategory;
  });
});

const loadPosts = async () => {
  loading.value = true;
  error.value = '';

  try {
    const response = await guestApi.publicInfo();
    const notices = Array.isArray(response?.newsItems) ? response.newsItems : [];
    if (notices.length > 0) {
      posts.value = notices.map((item, index) => ({
        id: item?.id || `news-${index + 1}`,
        date: item?.date || 'N/A',
        category: item?.category || 'Thong bao',
        title: item?.title || 'Bai viet',
        excerpt: item?.summary || item?.excerpt || '',
        image: item?.image || newsImages[index % newsImages.length],
      }));
    }
  } catch (e) {
    error.value = e?.message || 'Khong the tai danh sach bai viet.';
  } finally {
    loading.value = false;
  }
};

onMounted(loadPosts);
</script>

<style scoped>
.news-page {
  display: grid;
  gap: 20px;
}

.hero {
  background: linear-gradient(120deg, #fff7ed 0%, #fffbeb 100%);
}

.hero-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr);
  align-items: center;
}

.hero-cover {
  width: 100%;
  height: 230px;
  object-fit: cover;
  border: 1px solid #fed7aa;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #b45309;
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

.layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 22px;
}

.post-card {
  border-bottom: 1px solid #e5e7eb;
  padding: 0 0 18px;
  margin: 0 0 18px;
}

.post-cover {
  width: 100%;
  height: 190px;
  object-fit: cover;
  margin-bottom: 10px;
  border: 1px solid #e2e8f0;
}

.post-card:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.meta {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.post-card h2 {
  margin: 8px 0;
  font-size: 26px;
  line-height: 1.3;
}

.excerpt {
  margin: 0;
  color: #334155;
  line-height: 1.7;
}

.read-more {
  margin-top: 12px;
  display: inline-flex;
  color: #1d4ed8;
  text-decoration: none;
  border-bottom: 1px solid #93c5fd;
}

.sidebar {
  display: grid;
  gap: 14px;
  align-content: start;
}

.widget {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 16px;
  display: grid;
  gap: 10px;
}

.widget h3 {
  margin: 0;
}

.widget ul {
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.6;
}

.empty {
  margin: 0;
  color: #475569;
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-cover {
    height: 190px;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .hero h1 {
    font-size: 28px;
  }
}
</style>
