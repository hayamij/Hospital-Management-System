<template>
  <div class="news-page">
    <header class="panel hero">
      <div class="hero-grid">
        <div>
          <p class="eyebrow">Tin tức</p>
          <h1>Tin tức y khoa và thông báo</h1>
          <p class="lead">
            Cập nhật kiến thức y khoa, thông báo vận hành và các chương trình chăm sóc cộng đồng.
          </p>
        </div>
        <img
          class="hero-cover"
          src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80"
          alt="Bệnh viện hiện đại"
          loading="lazy"
        />
      </div>
    </header>

    <section class="panel layout">
      <main>
        <article v-for="post in visiblePosts" :key="post.id" class="post-card">
          <img class="post-cover" :src="post.image" :alt="`Minh họa tin tức ${post.title}`" loading="lazy" />
          <p class="meta">{{ post.date }} · {{ post.category }}</p>
          <h2>{{ post.title }}</h2>
          <p class="excerpt">{{ post.excerpt }}</p>
          <RouterLink class="read-more" :to="`/home-feature/news/${post.id}`">Đọc tiếp</RouterLink>
        </article>

        <p v-if="!loading && visiblePosts.length === 0" class="empty">Chưa có bài viết phù hợp bộ lọc.</p>
      </main>

      <aside class="sidebar">
        <section class="widget">
          <h3>Lọc bài viết</h3>
          <input
            v-model.trim="keyword"
            type="text"
            placeholder="Tìm theo tiêu đề"
            aria-label="Tìm theo tiêu đề"
          />
          <select v-model="selectedCategory" aria-label="Lọc theo danh mục">
            <option value="">Tất cả danh mục</option>
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>
        </section>

        <section class="widget">
          <h3>Thông báo nhanh</h3>
          <ul>
            <li>Khám tổng quát giảm tới 20% cho lịch đặt online trước 48 giờ.</li>
            <li>Trung tâm xét nghiệm mở rộng khung giờ đến 20:30 hằng ngày.</li>
            <li>Đường dây tư vấn 24/7: 1900 3493.</li>
          </ul>
        </section>
      </aside>
    </section>

    <p v-if="loading" class="msg">Đang tải bài viết...</p>
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
    category: 'Thông báo',
    title: 'Mở rộng khu khám ngoại trú',
    excerpt: 'Tăng số quầy tiếp nhận và tối ưu thời gian chờ của bệnh nhân.',
    image: newsImages[0],
  },
  {
    id: 'new-specialists',
    date: '2026-03-20',
    category: 'Y khoa',
    title: 'Bổ sung đội ngũ bác sĩ chuyên khoa',
    excerpt: 'Thêm bác sĩ tim mạch, nhi khoa và nội tổng quát trong quý này.',
    image: newsImages[1],
  },
  {
    id: 'online-queue',
    date: '2026-03-15',
    category: 'Công nghệ',
    title: 'Thông báo hàng đợi trực tuyến được triển khai',
    excerpt: 'Người bệnh có thể theo dõi thứ tự khám ngay trên hệ thống.',
    image: newsImages[2],
  },
  {
    id: 'community-campaign',
    date: '2026-03-10',
    category: 'Cộng đồng',
    title: 'Chuỗi tư vấn sức khỏe cộng đồng tháng 3',
    excerpt: 'Hoạt động tư vấn miễn phí cho người cao tuổi tại 4 điểm dân cư.',
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
        category: item?.category || 'Thông báo',
        title: item?.title || 'Bài viết',
        excerpt: item?.summary || item?.excerpt || '',
        image: item?.image || newsImages[index % newsImages.length],
      }));
    }
  } catch (e) {
    error.value = e?.message || 'Không thể tải danh sách bài viết.';
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
