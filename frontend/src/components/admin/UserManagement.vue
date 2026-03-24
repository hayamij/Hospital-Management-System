<template>
  <section class="panel">
    <header class="head-row">
      <div>
        <h2>Quan ly Nguoi dung</h2>
        <p>Quan ly Bac si va Benh nhan voi tim kiem, phan trang va chinh sua role.</p>
      </div>
      <button type="button" @click="openCreateModal">Them nguoi dung</button>
    </header>

    <div class="toolbar">
      <input v-model.trim="searchText" type="text" placeholder="Tim theo ten, email, ID..." />
      <select v-model="typeFilter">
        <option value="all">Tat ca nhom</option>
        <option value="doctor">Bac si</option>
        <option value="patient">Benh nhan</option>
      </select>
      <select v-model.number="pageSize">
        <option :value="5">5 / trang</option>
        <option :value="10">10 / trang</option>
        <option :value="20">20 / trang</option>
      </select>
    </div>

    <DataTable
      :columns="columns"
      :rows="paginatedRows"
      row-key="id"
      empty-text="Khong co nguoi dung phu hop dieu kien tim kiem."
    >
      <template #cell-type="{ value }">{{ value === 'doctor' ? 'Bac si' : 'Benh nhan' }}</template>
      <template #cell-actions="{ row }">
        <div class="row actions">
          <button type="button" @click="openEditModal(row)">Chinh sua</button>
        </div>
      </template>
    </DataTable>

    <div class="pagination">
      <button type="button" @click="prevPage" :disabled="page <= 1">Truoc</button>
      <span>Trang {{ page }} / {{ totalPages }}</span>
      <button type="button" @click="nextPage" :disabled="page >= totalPages">Sau</button>
    </div>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>

    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <h3>{{ modalMode === 'create' ? 'Them nguoi dung moi' : 'Chinh sua nguoi dung' }}</h3>

        <form class="modal-form" @submit.prevent="saveUser">
          <label class="field">
            <span>ID</span>
            <input v-model.trim="form.id" :disabled="modalMode === 'edit'" placeholder="user-001" />
            <small v-if="submitted && fieldErrors.id" class="field-error">{{ fieldErrors.id }}</small>
          </label>

          <label class="field">
            <span>Ho ten</span>
            <input v-model.trim="form.name" placeholder="Nguyen Van A" />
            <small v-if="submitted && fieldErrors.name" class="field-error">{{ fieldErrors.name }}</small>
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model.trim="form.email" type="email" placeholder="user@example.com" />
            <small v-if="submitted && fieldErrors.email" class="field-error">{{ fieldErrors.email }}</small>
          </label>

          <label class="field">
            <span>Nhom</span>
            <select v-model="form.type">
              <option value="doctor">Bac si</option>
              <option value="patient">Benh nhan</option>
            </select>
          </label>

          <label class="field">
            <span>Role</span>
            <select v-model="form.role">
              <option value="doctor">doctor</option>
              <option value="patient">patient</option>
              <option value="admin">admin</option>
            </select>
          </label>

          <label class="field">
            <span>Trang thai</span>
            <select v-model="form.status">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="disabled">disabled</option>
            </select>
          </label>

          <div class="row modal-actions">
            <button type="submit" :disabled="saving">{{ saving ? 'Dang luu...' : 'Luu' }}</button>
            <button type="button" @click="closeModal">Huy</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DataTable from '../shared/DataTable.vue';
import { adminApi, patientApi } from '../../services/api.js';
import { useAuthStore } from '../../stores/auth.js';

const auth = useAuthStore();

const columns = [
  { key: 'id', label: 'ID', width: '140px' },
  { key: 'name', label: 'Ho ten' },
  { key: 'email', label: 'Email', width: '230px' },
  { key: 'type', label: 'Nhom', width: '120px' },
  { key: 'role', label: 'Role', width: '120px' },
  { key: 'status', label: 'Trang thai', width: '130px' },
  { key: 'actions', label: 'Thao tac', width: '120px', align: 'center' },
];

const users = ref([]);
const searchText = ref('');
const typeFilter = ref('all');
const page = ref(1);
const pageSize = ref(10);

const status = ref('');
const error = ref('');
const saving = ref(false);

const modalOpen = ref(false);
const modalMode = ref('create');
const submitted = ref(false);

const form = reactive({
  id: '',
  name: '',
  email: '',
  type: 'doctor',
  role: 'doctor',
  status: 'active',
});

const fallbackUsers = [
  { id: 'doc-1', name: 'Dr. Demo', email: 'doc.demo@example.com', type: 'doctor', role: 'doctor', status: 'active' },
  { id: 'doc-2', name: 'Dr. Alice', email: 'alice@example.com', type: 'doctor', role: 'doctor', status: 'active' },
  { id: 'pat-1', name: 'Tran Van B', email: 'patient1@example.com', type: 'patient', role: 'patient', status: 'active' },
  { id: 'pat-2', name: 'Le Thi C', email: 'patient2@example.com', type: 'patient', role: 'patient', status: 'inactive' },
];

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase();

  return users.value.filter((item) => {
    const byType = typeFilter.value === 'all' || item.type === typeFilter.value;
    if (!byType) return false;

    if (!keyword) return true;
    return (
      item.id.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.email.toLowerCase().includes(keyword)
    );
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredRows.value.slice(start, end);
});

watch([searchText, typeFilter, pageSize], () => {
  page.value = 1;
});

watch(totalPages, (val) => {
  if (page.value > val) page.value = val;
});

const fieldErrors = computed(() => {
  const e = {};

  if (!form.id || form.id.length < 3) e.id = 'ID toi thieu 3 ky tu.';
  if (!form.name || form.name.length < 2) e.name = 'Ho ten toi thieu 2 ky tu.';

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email || '');
  if (!emailOk) e.email = 'Email khong hop le.';

  return e;
});

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.email = '';
  form.type = 'doctor';
  form.role = 'doctor';
  form.status = 'active';
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
  form.type = row.type;
  form.role = row.role;
  form.status = row.status;
};

const toStatusAction = (s) => {
  if (s === 'active') return 'activate';
  if (s === 'inactive') return 'deactivate';
  return 'disable';
};

const saveUser = async () => {
  submitted.value = true;
  status.value = '';
  error.value = '';

  if (Object.keys(fieldErrors.value).length > 0) {
    return;
  }

  saving.value = true;
  try {
    if (modalMode.value === 'create') {
      users.value.unshift({
        id: form.id,
        name: form.name,
        email: form.email,
        type: form.type,
        role: form.role,
        status: form.status,
      });
      status.value = 'Da them nguoi dung moi (frontend local).';
    } else {
      const idx = users.value.findIndex((u) => u.id === form.id);
      if (idx !== -1) {
        users.value[idx] = {
          ...users.value[idx],
          name: form.name,
          email: form.email,
          type: form.type,
          role: form.role,
          status: form.status,
        };
      }
    }

    if (auth.token && auth.userId) {
      await adminApi.assignRole(auth.token, form.id, { role: form.role, adminId: auth.userId });
      await adminApi.updateUserStatus(auth.token, form.id, { action: toStatusAction(form.status), adminId: auth.userId });
    }

    if (modalMode.value === 'edit') {
      status.value = 'Cap nhat nguoi dung thanh cong.';
    }

    closeModal();
  } catch (e) {
    error.value = e?.message || 'Khong the luu thong tin nguoi dung.';
  } finally {
    saving.value = false;
  }
};

const prevPage = () => {
  if (page.value > 1) page.value -= 1;
};

const nextPage = () => {
  if (page.value < totalPages.value) page.value += 1;
};

const hydrateDoctors = async () => {
  try {
    const response = await patientApi.searchDoctors({ page: 1, pageSize: 50 });
    const doctorRows = (response?.doctors || []).map((d, idx) => ({
      id: d.id || d.doctorId || `doc-${idx + 1}`,
      name: d.fullName || d.name || `Doctor ${idx + 1}`,
      email: d.email || `doctor${idx + 1}@example.com`,
      type: 'doctor',
      role: 'doctor',
      status: d.status || 'active',
    }));

    const patientRows = fallbackUsers.filter((u) => u.type === 'patient');
    users.value = [...doctorRows, ...patientRows];

    if (users.value.length === 0) {
      users.value = [...fallbackUsers];
    }
  } catch {
    users.value = [...fallbackUsers];
  }
};

onMounted(() => {
  auth.fetchCurrentUser();
  hydrateDoctors();
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
