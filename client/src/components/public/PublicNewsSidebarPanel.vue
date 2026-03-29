<template>
  <aside class="sidebar">
    <section class="widget">
      <h3>Lọc bài viết</h3>
      <input
        :value="keyword"
        type="text"
        placeholder="Tìm theo tiêu đề"
        aria-label="Tìm theo tiêu đề"
        @input="$emit('update:keyword', $event.target.value)"
      />
      <select :value="selectedCategory" aria-label="Lọc theo danh mục" @change="$emit('update:selectedCategory', $event.target.value)">
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
</template>

<script setup>
defineProps({
  keyword: { type: String, default: '' },
  selectedCategory: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
});

defineEmits(['update:keyword', 'update:selectedCategory']);
</script>

<style scoped>
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
</style>
