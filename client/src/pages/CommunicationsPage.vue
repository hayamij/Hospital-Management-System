<template>
  <div class="page">
    <header class="panel">
      <h1>Trao đổi</h1>
      <p>Gửi tin nhắn an toàn và duyệt ghi chú kết quả xét nghiệm.</p>
    </header>

    <section class="panel">
      <h2>Gửi tin nhắn</h2>
      <form class="grid two" @submit.prevent="sendMessage">
        <input v-if="isPatient" v-model="payload.doctorId" required placeholder="Mã bác sĩ" />
        <input v-if="isDoctor" v-model="payload.patientId" required placeholder="Mã bệnh nhân" />
        <input v-if="isPatient" v-model="payload.subject" placeholder="Tiêu đề" />
        <textarea v-model="payload.message" required rows="4" :placeholder="isDoctor ? 'Nội dung tin nhắn' : 'Nội dung'"
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
import { useRoleVisibility } from '../composables/useRoleVisibility.js';
import { sendMessageByRole } from '../stores/helpers/communicationsRoleApi.js';

const auth = useAuthStore();
const { isDoctor, isPatient, role } = useRoleVisibility(auth);
const status = ref('');
const error = ref('');

const payload = reactive({ doctorId: '', patientId: '', subject: '', message: '' });

const sendMessage = async () => {
  error.value = '';
  status.value = '';

  const sent = await sendMessageByRole({
    role: role.value,
    token: auth.token,
    userId: auth.userId,
    payload,
  });

  if (!sent) {
    error.value = 'Vai trò hiện tại không hỗ trợ gửi tin nhắn.';
    return;
  }

  status.value = 'Gửi tin nhắn thành công.';
};
</script>

<style scoped>
.two { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
</style>
