<template>
  <section class="panel">
    <header class="head-row">
      <div>
        <h2>Quản lý người dùng</h2>
        <p>Quản lý bác sĩ và bệnh nhân với tìm kiếm, phân trang và chỉnh sửa vai trò.</p>
      </div>
      <button type="button" @click="openCreateModal">Thêm người dùng</button>
    </header>

    <div class="toolbar">
      <input v-model.trim="searchText" type="text" placeholder="Tìm theo tên, email, ID..." />
      <select v-model="typeFilter">
        <option value="all">Tất cả nhóm</option>
        <option value="doctor">Bác sĩ</option>
        <option value="patient">Bệnh nhân</option>
        <option value="admin">Quản trị</option>
      </select>
      <select v-model.number="pageSize">
        <option :value="5">5 / trang</option>
        <option :value="10">10 / trang</option>
        <option :value="20">20 / trang</option>
      </select>
      <button type="button" @click="refresh">Tìm</button>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      empty-text="Không có người dùng phù hợp điều kiện tìm kiếm."
    >
      <template #cell-type="{ value }">{{ value === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân' }}</template>
      <template #cell-actions="{ row }">
        <div class="row actions">
          <button type="button" @click="openEditModal(row)">Chỉnh sửa</button>
        </div>
      </template>
    </DataTable>

    <div class="pagination">
      <button type="button" @click="prevPage" :disabled="page <= 1">Trước</button>
      <span>Trang {{ page }} / {{ totalPages }}</span>
      <button type="button" @click="nextPage" :disabled="page >= totalPages">Sau</button>
    </div>

    <p v-if="store.loading" class="msg">Đang tải danh sách...</p>
    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error || store.error" class="msg err">{{ error || store.error }}</p>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <h3>{{ modalMode === 'create' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng' }}</h3>

        <form class="modal-form" @submit.prevent="saveUser">
          <label class="field">
            <span>ID</span>
            <input v-model.trim="form.id" :disabled="modalMode === 'edit'" placeholder="user-001" />
            <small v-if="submitted && fieldErrors.id" class="field-error">{{ fieldErrors.id }}</small>
          </label>

          <label class="field">
            <span>Họ tên</span>
            <input v-model.trim="form.name" placeholder="Nguyen Van A" />
            <small v-if="submitted && fieldErrors.name" class="field-error">{{ fieldErrors.name }}</small>
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model.trim="form.email" type="email" placeholder="user@example.com" />
            <small v-if="submitted && fieldErrors.email" class="field-error">{{ fieldErrors.email }}</small>
          </label>

          <label class="field">
            <span>Nhóm</span>
            <select v-model="form.type">
              <option value="doctor">Bác sĩ</option>
              <option value="patient">Bệnh nhân</option>
            </select>
          </label>

          <label class="field">
            <span>Vai trò</span>
            <select v-model="form.role">
              <option value="doctor">Bác sĩ</option>
              <option value="patient">Bệnh nhân</option>
              <option value="admin">Quản trị</option>
            </select>
          </label>

          <label class="field">
            <span>Trạng thái</span>
            <select v-model="form.status">
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="disabled">Vô hiệu hóa</option>
              <option value="verified">Đã xác thực</option>
              <option value="pending">Chờ duyệt</option>
            </select>
          </label>

          <label v-if="modalMode === 'create'" class="field">
            <span>Mật khẩu tạm (tùy chọn)</span>
            <input v-model.trim="form.password" type="password" placeholder="Để trống nếu chưa cấp" />
          </label>

          <div class="row modal-actions">
            <button type="submit" :disabled="store.saving">{{ store.saving ? 'Đang lưu...' : 'Lưu' }}</button>
            <button type="button" @click="closeModal">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataTable from '../shared/DataTable.vue';
import { useAdminUsersStore } from '../../stores/adminUsers.js';

const columns = [
  { key: 'id', label: 'ID', width: '140px' },
  { key: 'name', label: 'Họ tên' },
  { key: 'email', label: 'Email', width: '230px' },
  { key: 'type', label: 'Nhóm', width: '120px' },
  { key: 'role', label: 'Vai trò', width: '120px' },
  { key: 'status', label: 'Trạng thái', width: '130px' },
  { key: 'actions', label: 'Thao tác', width: '120px', align: 'center' },
];

const store = useAdminUsersStore();
const searchText = ref('');
const typeFilter = ref('all');
const page = ref(1);
const pageSize = ref(10);

const status = ref('');
const error = ref('');

const modalOpen = ref(false);
const modalMode = ref('create');
const submitted = ref(false);

const form = reactive({
  id: '',
  name: '',
  email: '',
  type: 'patient',
  role: 'doctor',
  status: 'active',
  password: '',
});

const rows = computed(() =>
  store.users.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    type: item.type,
    role: item.role,
    status: item.status,
  }))
);

const totalPages = computed(() => Math.max(1, Math.ceil((store.total || 0) / pageSize.value)));

const syncRoleFromType = (type) => {
  if (type === 'doctor') return 'doctor';
  if (type === 'admin') return 'admin';
  return 'patient';
};

watch(
  () => form.type,
  (value) => {
    form.role = syncRoleFromType(value);
  }
);

watch([searchText, typeFilter, pageSize], () => {
  page.value = 1;
  refresh();
});

watch(totalPages, (val) => {
  if (page.value > val) page.value = val;
});

const fieldErrors = computed(() => {
  const e = {};

  if (!form.id || form.id.length < 3) e.id = 'ID tối thiểu 3 ký tự.';
  if (!form.name || form.name.length < 2) e.name = 'Họ tên tối thiểu 2 ký tự.';

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '');
  if (!emailOk) e.email = 'Email không hợp lệ.';

  return e;
});

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.email = '';
  form.type = 'patient';
  form.role = 'patient';
  form.status = 'active';
  form.password = '';
  submitted.value = false;
};

const closeModal = () => {
  modalOpen.value = false;
  resetForm();
};

const openCreateModal = () => {
  modalMode.value = 'create';
  status.value = '';
  error.value = '';
  modalOpen.value = true;
  resetForm();
};

const openEditModal = (row) => {
  modalMode.value = 'edit';
  status.value = '';
  error.value = '';
  modalOpen.value = true;
  submitted.value = false;

  form.id = row.id;
  form.name = row.name;
  form.email = row.email;
  form.type = row.type || (row.role === 'doctor' ? 'doctor' : row.role === 'admin' ? 'admin' : 'patient');
  form.role = row.role;
  form.status = row.status;
  form.password = '';
};

const refresh = async () => {
  error.value = '';
  try {
    await store.fetchUsers({
      query: searchText.value,
      type: typeFilter.value === 'all' ? undefined : typeFilter.value,
      page: page.value,
      pageSize: pageSize.value,
    });
  } catch (e) {
    error.value = e?.message || 'Không thể tải danh sách người dùng.';
  }
};

const saveUser = async () => {
  submitted.value = true;
  status.value = '';
  error.value = '';

  if (Object.keys(fieldErrors.value).length > 0) {
    return;
  }

  try {
    if (modalMode.value === 'create') {
      await store.createUser({
        fullName: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
        password: form.password || undefined,
      });
      status.value = 'Đã thêm người dùng mới.';
    } else {
      await store.updateUser(form.id, {
        fullName: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
      });
      status.value = 'Cập nhật người dùng thành công.';
    }

    closeModal();
  } catch (e) {
    error.value = e?.message || 'Không thể lưu thông tin người dùng.';
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value -= 1;
    refresh();
  }
};

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value += 1;
    refresh();
  }
};

onMounted(() => {
  refresh();
});
</script>

<style scoped>
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar {
  margin: 14px 0;
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 180px 140px;
}

.pagination {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.actions {
  justify-content: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal-card {
  width: min(760px, 100%);
  border: 1px solid #d1d5db;
  background: #ffffff;
  padding: 18px;
}

.modal-card h3 {
  margin: 0 0 12px;
}

.modal-form {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  color: #334155;
}

.field-error {
  color: #b91c1c;
  font-size: 13px;
}

.modal-actions {
  grid-column: 1 / -1;
  margin-top: 4px;
}

@media (max-width: 900px) {
  .toolbar {
    grid-template-columns: 1fr;
  }

  .modal-form {
    grid-template-columns: 1fr;
  }
}
</style>
