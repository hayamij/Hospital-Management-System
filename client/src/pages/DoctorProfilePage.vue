<template>
  <div class="page">
    <header class="panel profile-header">
      <div class="header-copy">
        <p class="eyebrow">DOCTOR PROFILE</p>
        <h1>Hồ sơ bác sĩ</h1>
        <p>Cập nhật thông tin chuyên môn, trạng thái làm việc và năng lực tiếp nhận lịch hẹn.</p>
      </div>

      <div class="header-actions">
        <button type="button" @click="restoreDefaults" :disabled="doctorProfile.submitting">Khôi phục mặc định</button>
      </div>
    </header>

    <section class="profile-grid">
      <article class="panel">
        <div class="section-head">
          <h2>Thông tin hành nghề</h2>
          <small>Các trường bắt buộc phục vụ điều phối lịch khám</small>
        </div>

        <form class="profile-form" @submit.prevent="submitProfile">
          <div class="profile-form-grid">
            <label class="form-field">
              <span>Họ và tên</span>
              <input v-model.trim="doctorProfile.form.fullName" required placeholder="Nguyễn Văn A" />
            </label>

            <label class="form-field">
              <span>Chuyên khoa</span>
              <input v-model.trim="doctorProfile.form.specialization" required placeholder="Nội tổng quát" />
            </label>

            <label class="form-field">
              <span>Khoa/Phòng ban</span>
              <input v-model.trim="doctorProfile.form.department" placeholder="Khoa khám bệnh" />
            </label>

            <label class="form-field">
              <span>Trạng thái làm việc</span>
              <select v-model="doctorProfile.form.status">
                <option value="active">Đang hoạt động</option>
                <option value="on_leave">Đang nghỉ phép</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
            </label>

            <label class="form-field slots-field">
              <span>Số khung giờ tối đa mỗi ngày</span>
              <input v-model.number="doctorProfile.form.slotsPerDay" type="number" min="0" step="1" placeholder="12" />
            </label>
          </div>

          <div class="row profile-actions">
            <button type="submit" :disabled="doctorProfile.submitting">Lưu hồ sơ</button>
            <button type="button" @click="restoreDefaults" :disabled="doctorProfile.submitting">Khôi phục</button>
          </div>
        </form>

        <p v-if="doctorProfile.success" class="msg ok">{{ doctorProfile.success }}</p>
        <p v-if="doctorProfile.error" class="msg err">{{ doctorProfile.error }}</p>
      </article>

      <article class="panel snapshot-panel">
        <div class="section-head">
          <h2>Thông tin đã lưu gần nhất</h2>
          <small>Snapshot sau lần cập nhật thành công gần nhất</small>
        </div>

        <div v-if="doctorProfile.lastSaved.profile" class="list-grid">
          <article class="item snapshot-item">
            <h3>{{ doctorProfile.lastSaved.profile.fullName || '-' }}</h3>
            <dl class="snapshot-meta">
              <div>
                <dt>Chuyên khoa</dt>
                <dd>{{ doctorProfile.lastSaved.profile.specialization || '-' }}</dd>
              </div>
              <div>
                <dt>Phòng ban</dt>
                <dd>{{ doctorProfile.lastSaved.profile.department || '-' }}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>{{ formatStatus(doctorProfile.lastSaved.profile.status) }}</dd>
              </div>
              <div>
                <dt>Slots/ngày</dt>
                <dd>{{ doctorProfile.lastSaved.slotsPerDay ?? '-' }}</dd>
              </div>
            </dl>
          </article>
        </div>

        <p v-else class="muted">Chưa có bản ghi snapshot. Hãy lưu hồ sơ để tạo dữ liệu tham chiếu.</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useDoctorProfileStore } from '../stores/doctorProfile.js';

const auth = useAuthStore();
const doctorProfile = useDoctorProfileStore();

const formatStatus = (status) => {
  const map = {
    active: 'Đang hoạt động',
    on_leave: 'Đang nghỉ phép',
    inactive: 'Ngưng hoạt động',
  };
  return map[status] || status || '-';
};

const restoreDefaults = () => {
  doctorProfile.restoreDefaults();
};

const submitProfile = async () => {
  try {
    await doctorProfile.updateProfile();
  } catch {
    // error message is managed in store
  }
};

onMounted(() => {
  auth.fetchCurrentUser();
  restoreDefaults();
});
</script>

<style scoped>
.profile-header {
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

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 16px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.section-head h2 {
  margin: 0;
}

.section-head small {
  color: #64748b;
}

.profile-form {
  display: grid;
  gap: 14px;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: start;
}

.form-field {
  display: grid;
  gap: 8px;
  align-content: start;
}

.form-field span {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: #334155;
}

.slots-field {
  grid-column: 1 / -1;
}

.profile-actions {
  align-items: center;
}

.profile-actions button {
  min-width: 120px;
}

.snapshot-item {
  border: 1px solid #dbe2ea;
  background: #f8fafc;
  padding: 14px;
  display: grid;
  gap: 8px;
}

.snapshot-item h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.snapshot-meta {
  margin: 0;
  display: grid;
  gap: 10px;
}

.snapshot-meta div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.snapshot-meta dt,
.snapshot-meta dd {
  margin: 0;
  color: #334155;
}

.snapshot-meta dt {
  font-weight: 600;
}

.snapshot-meta dd {
  text-align: right;
}

.muted {
  margin: 0;
  color: #64748b;
}

@media (max-width: 1200px) {
  .header-copy h1 {
    font-size: 28px;
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
  }

  .slots-field {
    grid-column: auto;
  }

  .snapshot-meta div {
    flex-direction: column;
    gap: 4px;
  }

  .snapshot-meta dd {
    text-align: left;
  }
}
</style>
