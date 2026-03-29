<template>
  <div class="page">
    <header class="panel">
      <h1>Trao đổi</h1>
      <p>Gửi tin nhắn an toàn và duyệt ghi chú kết quả xét nghiệm.</p>
    </header>

    <section class="panel">
      <h2>Gửi tin nhắn</h2>
      <form class="grid two" @submit.prevent="sendMessage">
        <input v-if="auth.role === 'patient'" v-model="payload.doctorId" required placeholder="Mã bác sĩ" />
        <input v-if="auth.role === 'doctor'" v-model="payload.patientId" required placeholder="Mã bệnh nhân" />
        <input v-if="auth.role === 'patient'" v-model="payload.subject" placeholder="Tiêu đề" />
        <textarea v-model="payload.message" required rows="4" :placeholder="auth.role === 'doctor' ? 'Nội dung tin nhắn' : 'Nội dung'"
        ></textarea>
        <button type="submit">Gửi</button>
      </form>
    </section>

    <p v-if="status" class="msg ok">{{ status }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { doctorApi, patientApi } from '../services/api.js';

const auth = useAuthStore();
const status = ref('');
const error = ref('');

const payload = reactive({ doctorId: '', patientId: '', subject: '', message: '' });

const sendMessage = async () => {
  error.value = '';
  status.value = '';

  if (auth.role === 'patient') {
    await patientApi.sendMessage(auth.token, {
      patientId: auth.userId,
      doctorId: payload.doctorId,
      subject: payload.subject,
      message: payload.message,
    });
  }

  if (auth.role === 'doctor') {
    await doctorApi.sendMessage(auth.token, {
      doctorId: auth.userId,
      patientId: payload.patientId,
      content: payload.message,
    });
  }

  status.value = 'Gửi tin nhắn thành công.';
};
</script>

<style scoped>
.two { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
</style>
