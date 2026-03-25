<template>
  <div class="page">
    <header class="panel">
      <h1>Cổng thông tin công khai</h1>
      <p>Tác vụ khách: xem thông tin công khai, tìm bác sĩ, xem khung giờ và gửi liên hệ.</p>
      <div class="row">
        <RouterLink to="/">Trang chủ</RouterLink>
        <RouterLink to="/login">Đăng nhập</RouterLink>
        <RouterLink to="/register">Đăng ký</RouterLink>
      </div>
    </header>

    <section class="grid two-col">
      <article class="panel">
        <h2>Thông tin công khai</h2>
        <button type="button" @click="loadPublicInfo">Tải dữ liệu công khai</button>
        <pre class="pre">{{ pretty(publicInfo) }}</pre>
      </article>

      <article class="panel">
        <h2>Tìm bác sĩ (khách)</h2>
        <form class="grid three" @submit.prevent="searchDoctors">
          <input v-model="search.query" placeholder="Tên bác sĩ" />
          <input v-model="search.specialty" placeholder="Chuyên khoa" />
          <button type="submit">Tìm kiếm</button>
        </form>
        <ul class="list">
          <li v-for="d in doctors" :key="d.id || d.doctorId" class="item">
            <p><strong>{{ d.fullName || d.name }}</strong></p>
            <p>{{ d.specialization || d.specialty }}</p>
          </li>
        </ul>
      </article>
    </section>

    <section class="grid two-col">
      <article class="panel">
        <h2>Kiểm tra khung giờ trống</h2>
        <form class="grid three" @submit.prevent="loadSlots">
          <input v-model="slotForm.doctorId" required placeholder="Mã bác sĩ" />
          <input v-model="slotForm.from" type="date" />
          <input v-model="slotForm.to" type="date" />
          <button type="submit">Lấy khung giờ</button>
        </form>
        <pre class="pre">{{ pretty(slots) }}</pre>
      </article>

      <article class="panel">
        <h2>Bắt đầu đăng ký</h2>
        <form class="grid" @submit.prevent="startRegistration">
          <input v-model="registration.fullName" required placeholder="Họ và tên" />
          <input v-model="registration.email" type="email" required placeholder="Email" />
          <input v-model="registration.phone" required placeholder="Số điện thoại" />
          <button type="submit">Bắt đầu đăng ký</button>
        </form>
      </article>

      <article class="panel">
        <h2>Liên hệ phòng khám</h2>
        <form class="grid" @submit.prevent="sendContact">
          <input v-model="contact.fullName" required placeholder="Họ và tên" />
          <input v-model="contact.phone" required placeholder="Số điện thoại" />
          <input v-model="contact.email" type="email" placeholder="Email" />
          <textarea v-model="contact.message" required rows="4" placeholder="Nội dung liên hệ"></textarea>
          <button type="submit">Gửi liên hệ</button>
        </form>
      </article>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { guestApi } from '../services/api.js';

const publicInfo = ref(null);
const doctors = ref([]);
const slots = ref(null);
const status = ref('');
const error = ref('');

const search = reactive({ query: '', specialty: '' });
const slotForm = reactive({ doctorId: '', from: '', to: '' });
const registration = reactive({ fullName: '', email: '', phone: '' });
const contact = reactive({ fullName: '', phone: '', email: '', message: '' });

const pretty = (value) => (value ? JSON.stringify(value, null, 2) : 'Chưa có dữ liệu.');

const loadPublicInfo = async () => {
  error.value = '';
  publicInfo.value = await guestApi.publicInfo();
};

const searchDoctors = async () => {
  error.value = '';
  const response = await guestApi.searchDoctors(search);
  doctors.value = response.doctors || [];
};

const loadSlots = async () => {
  error.value = '';
  slots.value = await guestApi.availableSlots(slotForm.doctorId, { from: slotForm.from, to: slotForm.to });
};

const startRegistration = async () => {
  error.value = '';
  status.value = '';
  await guestApi.startRegistration(registration);
  status.value = 'Yêu cầu đăng ký đã được ghi nhận.';
};

const sendContact = async () => {
  error.value = '';
  status.value = '';
  await guestApi.contact(contact);
  status.value = 'Yêu cầu liên hệ đã được gửi.';
};
</script>

<style scoped>
.row a { text-decoration: none; color: #111827; }
.two-col { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.three { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.list { margin: 14px 0 0; padding-left: 22px; }
.item { margin: 10px 0; }
.pre { border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; max-height: 300px; overflow: auto; }
</style>
