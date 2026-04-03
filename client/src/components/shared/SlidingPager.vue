<template>
  <div class="pager-shell" :class="{ 'is-single': !hasMultiplePages }">
    <button
      type="button"
      class="nav-button"
      :disabled="showAll || !hasMultiplePages || isFirstPage"
      aria-label="Trang trước"
      @click="goPrev"
    >
      <span aria-hidden="true">&#8249;</span>
    </button>

    <div class="viewport">
      <p v-if="itemCount === 0" class="empty">{{ emptyText }}</p>

      <div v-else-if="showAll" class="all-grid" :style="{ '--columns': activeItemsPerPage }">
        <div
          v-for="(item, itemIndex) in items"
          :key="itemKey(item, itemIndex, 0)"
          class="item"
        >
          <slot :item="item" :index="itemIndex" />
        </div>
      </div>

      <div v-else class="track" :style="trackStyle">
        <div
          v-for="(page, pageIndex) in pagedItems"
          :key="`page-${pageIndex}`"
          class="page"
          :style="{ '--columns': activeItemsPerPage }"
        >
          <div
            v-for="(item, itemIndex) in page"
            :key="itemKey(item, itemIndex, pageIndex)"
            class="item"
          >
            <slot :item="item" :index="pageIndex * activeItemsPerPage + itemIndex" />
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="nav-button"
      :disabled="showAll || !hasMultiplePages || isLastPage"
      aria-label="Trang tiếp theo"
      @click="goNext"
    >
      <span aria-hidden="true">&#8250;</span>
    </button>
  </div>

  <div v-if="hasMultiplePages" class="pager-footer">
    <p class="pager-meta">
      {{ showAll ? `Hiển thị tất cả ${itemCount} mục` : `Trang ${currentPage + 1} / ${totalPages}` }}
    </p>

    <button
      v-if="showViewAllToggle"
      type="button"
      class="view-all-btn"
      @click="toggleViewAll"
    >
      {{ showAll ? collapseLabel : viewAllLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  itemsPerPage: { type: Number, default: 3 },
  mobileItemsPerPage: { type: Number, default: 1 },
  mobileBreakpoint: { type: Number, default: 900 },
  emptyText: { type: String, default: 'Không có dữ liệu để hiển thị.' },
  showViewAllToggle: { type: Boolean, default: true },
  viewAllLabel: { type: String, default: 'Xem tất cả' },
  collapseLabel: { type: String, default: 'Thu gọn' },
});

const currentPage = ref(0);
const showAll = ref(false);
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

const itemCount = computed(() => (Array.isArray(props.items) ? props.items.length : 0));

const activeItemsPerPage = computed(() => {
  const desktopCount = Math.max(1, Number(props.itemsPerPage) || 1);
  const mobileCount = Math.max(1, Number(props.mobileItemsPerPage) || 1);

  return viewportWidth.value <= props.mobileBreakpoint ? mobileCount : desktopCount;
});

const pagedItems = computed(() => {
  if (!Array.isArray(props.items) || props.items.length === 0) {
    return [];
  }

  const pages = [];
  for (let index = 0; index < props.items.length; index += activeItemsPerPage.value) {
    pages.push(props.items.slice(index, index + activeItemsPerPage.value));
  }

  return pages;
});

const totalPages = computed(() => Math.max(1, pagedItems.value.length));
const hasMultiplePages = computed(() => pagedItems.value.length > 1);
const isFirstPage = computed(() => currentPage.value <= 0);
const isLastPage = computed(() => currentPage.value >= totalPages.value - 1);

const trackStyle = computed(() => ({
  transform: `translateX(-${currentPage.value * 100}%)`,
}));

const keepPageInRange = () => {
  if (currentPage.value > totalPages.value - 1) {
    currentPage.value = totalPages.value - 1;
  }

  if (currentPage.value < 0) {
    currentPage.value = 0;
  }

  if (!hasMultiplePages.value) {
    showAll.value = false;
  }
};

watch([itemCount, activeItemsPerPage], keepPageInRange, { immediate: true });

const goPrev = () => {
  if (!isFirstPage.value) {
    currentPage.value -= 1;
  }
};

const goNext = () => {
  if (!isLastPage.value) {
    currentPage.value += 1;
  }
};

const toggleViewAll = () => {
  showAll.value = !showAll.value;
};

const itemKey = (item, itemIndex, pageIndex) =>
  item?.id || item?.doctorId || item?.invoiceId || `p-${pageIndex}-i-${itemIndex}`;

const handleResize = () => {
  if (typeof window !== 'undefined') {
    viewportWidth.value = window.innerWidth;
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize);
  }
});
</script>

<style scoped>
.pager-shell {
  margin-top: 18px;
  display: grid;
  gap: 10px;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
}

.nav-button {
  width: 44px;
  height: 44px;
  align-self: center;
  justify-self: center;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.nav-button:not(:disabled):hover,
.nav-button:not(:disabled):focus-visible {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.nav-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.viewport {
  width: 100%;
  overflow: hidden;
  border-radius: 2px;
}

.track {
  display: flex;
  transition: transform 0.35s ease;
  will-change: transform;
}

.page {
  min-width: 100%;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
}

.item {
  min-width: 0;
}

.all-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
}

.empty {
  margin: 0;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #475569;
  padding: 16px;
}

.pager-footer {
  margin: 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pager-meta {
  margin: 0;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}

.view-all-btn {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

@media (max-width: 900px) {
  .pager-shell {
    grid-template-columns: 38px minmax(0, 1fr) 38px;
  }

  .nav-button {
    width: 38px;
    height: 38px;
    font-size: 20px;
  }

  .pager-meta {
    width: 100%;
    text-align: left;
  }

  .view-all-btn {
    width: 100%;
  }
}
</style>
