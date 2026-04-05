<template>
  <div class="page admin-services-page">
    <header class="panel workspace-header">
      <div class="header-copy">
        <p class="eyebrow">ADMIN SERVICES</p>
        <h1>Quản lý dịch vụ và cấu hình</h1>
        <p>Quản lý danh mục dịch vụ, tham số hệ thống và báo cáo mà không trộn với trang nhân sự.</p>
      </div>

      <div class="header-actions">
        <RouterLink class="action-link" to="/admin/staff">Đến quản lý nhân sự</RouterLink>
        <RouterLink class="action-link" to="/admin/dashboard">Về dashboard</RouterLink>
      </div>
    </header>

    <section class="panel">
      <header class="head-row">
        <div>
          <h2>Danh sách dịch vụ</h2>
          <p>Mặc định hiển thị toàn bộ dịch vụ, có tìm kiếm và phân trang.</p>
        </div>
        <button type="button" :disabled="loadingServices" @click="handleRefreshServices">Làm mới</button>
      </header>

      <div class="toolbar">
        <input v-model.trim="searchText" type="text" placeholder="Tìm theo tên hoặc mã dịch vụ..." />
        <select v-model.number="pageSize">
          <option :value="5">5 / trang</option>
          <option :value="10">10 / trang</option>
          <option :value="20">20 / trang</option>
        </select>
        <button type="button" :disabled="loadingServices" @click="handleSearch">Tìm</button>
      </div>

      <DataTable
        :columns="columns"
        :rows="rows"
        row-key="id"
        empty-text="Không có dịch vụ phù hợp điều kiện tìm kiếm."
      >
        <template #cell-price="{ value }">
          {{ formatCurrency(value) }}
        </template>
        <template #cell-actions="{ row }">
          <div class="row actions">
            <button type="button" @click="openEditService(row)">Chỉnh sửa</button>
            <button type="button" @click="removeService(row)">Xóa</button>
          </div>
        </template>
      </DataTable>

      <div class="pagination">
        <button type="button" @click="prevPage" :disabled="page <= 1">Trước</button>
        <span>Trang {{ page }} / {{ totalPages }}</span>
        <button type="button" @click="nextPage" :disabled="page >= totalPages">Sau</button>
      </div>

      <p v-if="loadingServices" class="msg">Đang tải danh sách dịch vụ...</p>
    </section>

    <section class="panel ops-card">
      <div class="section-head">
        <h2>{{ editingServiceId ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới' }}</h2>
        <small>{{ editingServiceId ? `Đang chỉnh sửa: ${editingServiceId}` : 'Nhập thông tin dịch vụ để lưu' }}</small>
      </div>

      <form class="grid three" @submit.prevent="saveService">
        <input v-model="serviceOps.id" placeholder="Mã dịch vụ (tùy chọn)" :disabled="Boolean(editingServiceId)" />
        <input v-model="serviceOps.name" placeholder="Tên dịch vụ" required />
        <input v-model.number="serviceOps.price" type="number" min="0" placeholder="Giá dịch vụ" required />
        <button type="submit">{{ editingServiceId ? 'Lưu thay đổi' : 'Thêm dịch vụ' }}</button>
        <button type="button" @click="clearServiceForm">Xóa form</button>
      </form>
    </section>

    <section class="panel ops-card">
      <div class="section-head">
        <h2>Cấu hình hệ thống</h2>
        <small>Thiết lập thông số vận hành</small>
      </div>

      <form class="grid three" @submit.prevent="updateSettings">
        <input v-model="settingsOps.clinicName" placeholder="Tên cơ sở" required />
        <input v-model="settingsOps.timezone" placeholder="Múi giờ" required />
        <button type="submit">Cập nhật thiết lập</button>
      </form>
    </section>

    <section class="panel ops-card">
      <div class="section-head">
        <h2>Báo cáo nhanh</h2>
        <small>Chạy báo cáo theo khoảng thời gian</small>
      </div>

      <form class="grid three" @submit.prevent="runReport">
        <input v-model="reportOps.reportName" placeholder="Tên báo cáo" required />
        <input v-model="reportOps.from" type="date" />
        <input v-model="reportOps.to" type="date" />
        <button type="submit">Chạy báo cáo</button>
      </form>

      <pre class="pre report-box">{{ prettyReport(reportResult) }}</pre>
    </section>

    <section class="panel status-strip" v-if="status || error">
      <p v-if="status" class="msg ok">{{ status }}</p>
      <p v-if="error" class="msg err">{{ error }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataTable from '../components/shared/DataTable.vue';
import { useAuthStore } from '../stores/auth.js';
import { adminApi } from '../services/api.js';
import {
  buildServicePayload,
  prettyReport,
  withFeedback
} from './controllers/adminOpsController.js';

const auth = useAuthStore();
const status = ref('');
const error = ref('');
const reportResult = ref(null);
const loadingServices = ref(false);
const services = ref([]);
const searchText = ref('');
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const editingServiceId = ref('');
const isResettingServices = ref(false);

const columns = [
  { key: 'id', label: 'ID', width: '120px' },
  { key: 'name', label: 'Tên dịch vụ' },
  { key: 'price', label: 'Giá', width: '170px', align: 'right' },
  { key: 'actions', label: 'Thao tác', width: '230px', align: 'center' }
];

const serviceOps = reactive({ id: '', name: '', price: 0 });
const settingsOps = reactive({ clinicName: 'Bệnh viện', timezone: 'Asia/Ho_Chi_Minh' });
const reportOps = reactive({ reportName: 'system_overview', from: '', to: '' });

const rows = computed(() =>
  services.value.map((service) => ({
    id: service?.id || '',
    name: service?.name || '',
    price: Number(service?.price || 0)
  }))
);

const totalPages = computed(() => Math.max(1, Math.ceil((total.value || 0) / pageSize.value)));

const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN') + ' VND';

const refreshServices = async () => {
  loadingServices.value = true;
  error.value = '';

  try {
    const response = await adminApi.listServices(auth.token, {
      q: searchText.value || undefined,
      page: page.value,
      pageSize: pageSize.value
    });

    services.value = Array.isArray(response?.services) ? response.services : [];
    total.value = Number(response?.total || 0);
    page.value = Number(response?.page || 1);
    pageSize.value = Number(response?.pageSize || pageSize.value);
  } catch (e) {
    error.value = e?.message || 'Không thể tải danh sách dịch vụ.';
  } finally {
    loadingServices.value = false;
  }
};

watch(pageSize, () => {
	if (isResettingServices.value) return;
  page.value = 1;
  refreshServices();
});

watch(totalPages, (value) => {
  if (page.value > value) {
    page.value = value;
    refreshServices();
  }
});

const openEditService = (service) => {
  editingServiceId.value = service.id;
  serviceOps.id = service.id;
  serviceOps.name = service.name;
  serviceOps.price = Number(service.price || 0);
  status.value = '';
  error.value = '';
};

const clearServiceForm = () => {
  editingServiceId.value = '';
  serviceOps.id = '';
  serviceOps.name = '';
  serviceOps.price = 0;
};

const handleRefreshServices = async () => {
  isResettingServices.value = true;
  try {
    searchText.value = '';
    page.value = 1;
    pageSize.value = 10;
    clearServiceForm();
    status.value = '';
    error.value = '';
    await refreshServices();
  } finally {
    isResettingServices.value = false;
  }
};

const handleSearch = async () => {
  page.value = 1;
  await refreshServices();
};

const saveService = async () => {
  await withFeedback({
    run: async () => {
      await adminApi.upsertService(auth.token, buildServicePayload(serviceOps, auth.userId));
      await refreshServices();
      clearServiceForm();
    },
    setStatus: (message) => (status.value = message),
    setError: (message) => (error.value = message),
    successText: 'Cập nhật dịch vụ thành công.'
  });
};

const removeService = async (service) => {
  await withFeedback({
    run: async () => {
      await adminApi.removeService(auth.token, service.id);
      await refreshServices();
      if (editingServiceId.value === service.id) {
        clearServiceForm();
      }
    },
    setStatus: (message) => (status.value = message),
    setError: (message) => (error.value = message),
    successText: 'Đã xóa dịch vụ.'
  });
};

const prevPage = () => {
  if (page.value <= 1) return;
  page.value -= 1;
  refreshServices();
};

const nextPage = () => {
  if (page.value >= totalPages.value) return;
  page.value += 1;
  refreshServices();
};

const updateSettings = () =>
  withFeedback({
    run: () => adminApi.updateSettings(auth.token, { ...settingsOps, adminId: auth.userId }),
    setStatus: (message) => (status.value = message),
    setError: (message) => (error.value = message),
    successText: 'Cập nhật thiết lập hệ thống thành công.',
  });

const runReport = () =>
  withFeedback({
    run: async () => {
      reportResult.value = await adminApi.runReport(auth.token, reportOps);
    },
    setStatus: (message) => (status.value = message),
    setError: (message) => (error.value = message),
    successText: 'Tạo báo cáo thành công.'
  });

onMounted(() => {
  refreshServices();
});
</script>

<style scoped>
.admin-services-page {
  display: grid;
  gap: 18px;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1d4ed8;
}

.header-copy h1 {
  margin: 8px 0 0;
  font-size: 34px;
}

.header-copy p {
  margin: 10px 0 0;
  color: #334155;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-link {
  min-height: 44px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #111827;
  text-decoration: none;
}

.ops-card {
  display: grid;
  gap: 12px;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.head-row p {
  margin: 8px 0 0;
  color: #475569;
}

.toolbar {
  margin: 14px 0 16px;
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 150px auto;
}

.pagination {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.actions {
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.actions button {
  min-width: 100px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.section-head h2 {
  margin: 0;
}

.section-head small {
  color: #64748b;
}

.three {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.pre {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 12px;
  max-height: 320px;
  overflow: auto;
}

.status-strip {
  display: grid;
  gap: 10px;
}

@media (max-width: 1100px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .action-link {
    width: 100%;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
