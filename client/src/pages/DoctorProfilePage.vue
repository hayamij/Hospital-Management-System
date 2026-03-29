<template>
  <div class="page">
    <header class="panel">
      <h1>Hồ sơ bác sĩ</h1>
      <p>Cập nhật thông tin chuyên môn và khả năng tiếp nhận lịch hẹn.</p>
    </header>

    <section class="panel">
      <h2>Thông tin hành nghề</h2>
      <form class="grid two" @submit.prevent="submitProfile">
        <label>
          <span>Họ và tên</span>
          <input v-model.trim="doctorProfile.form.fullName" required placeholder="Nguyễn Văn A" />
        </label>

        <label>
          <span>Chuyên khoa</span>
          <input v-model.trim="doctorProfile.form.specialization" required placeholder="Nội tổng quát" />
        </label>

        <label>
          <span>Khoa/Phòng ban</span>
          <input v-model.trim="doctorProfile.form.department" placeholder="Khoa khám bệnh" />
        </label>

        <label>
          <span>Trạng thái làm việc</span>
          <select v-model="doctorProfile.form.status">
            <option value="active">Đang hoạt động</option>
            <option value="on_leave">Đang nghỉ phép</option>
            <option value="inactive">Ngưng hoạt động</option>
          </select>
        </label>

        <label class="full-row">
          <span>Số khung giờ tối đa mỗi ngày</span>
          <input v-model.number="doctorProfile.form.slotsPerDay" type="number" min="0" step="1" placeholder="12" />
        </label>

        <div class="row full-row">
          <button type="submit" :disabled="doctorProfile.submitting">Lưu hồ sơ</button>
          <button type="button" @click="restoreDefaults" :disabled="doctorProfile.submitting">Khôi phục</button>
        </div>
      </form>

      <p v-if="doctorProfile.success" class="msg ok">{{ doctorProfile.success }}</p>
      <p v-if="doctorProfile.error" class="msg err">{{ doctorProfile.error }}</p>
    </section>

    <section class="panel" v-if="doctorProfile.lastSaved.profile">
      <h2>Thông tin đã lưu gần nhất</h2>
      <div class="list-grid">
        <article class="item">
          <p><strong>{{ doctorProfile.lastSaved.profile.fullName || '-' }}</strong></p>
          <p>Chuyên khoa: {{ doctorProfile.lastSaved.profile.specialization || '-' }}</p>
          <p>Phòng ban: {{ doctorProfile.lastSaved.profile.department || '-' }}</p>
          <p>Trạng thái: {{ formatStatus(doctorProfile.lastSaved.profile.status) }}</p>
          <p>Slots/ngày: {{ doctorProfile.lastSaved.slotsPerDay ?? '-' }}</p>
        </article>
      </div>
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
.two { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.full-row { grid-column: 1 / -1; }
.item { display: grid; gap: 8px; }
</style>
