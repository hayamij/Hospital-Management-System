<template>
  <section class="auth-wrap">
    <div class="auth-card">
      <h1>Tạo tài khoản</h1>
      <p class="muted">Đăng ký luôn tạo tài khoản bệnh nhân.</p>

      <form class="form" @submit.prevent="submit">
        <FormField label="Họ và tên">
          <input v-model.trim="form.fullName" required placeholder="Nguyen Van A" />
        </FormField>

        <FormField label="Email">
          <input v-model.trim="form.email" type="email" required placeholder="user@example.com" />
        </FormField>

        <FormField label="Số điện thoại">
          <input v-model.trim="form.phone" type="tel" required placeholder="0901234567" />
        </FormField>

        <FormField label="Mật khẩu">
          <input v-model="form.password" type="password" required minlength="8" placeholder="Ít nhất 8 ký tự" />
        </FormField>

        <FormField label="Xác nhận mật khẩu">
          <input v-model="form.confirmPassword" type="password" required minlength="8" placeholder="Nhập lại mật khẩu" />
        </FormField>

        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Đang tạo...' : 'Tạo tài khoản' }}
        </button>
      </form>

      <p class="switch">
        Đã có tài khoản?
        <RouterLink to="/login">Đăng nhập</RouterLink>
      </p>

      <Alert v-if="auth.error" :message="auth.error" />
    </div>
  </section>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { patientApi } from '../services/api.js';
import { useAuthStore } from '../stores/auth.js';
import FormField from '../components/shared/FormField.vue';
import Alert from '../components/shared/Alert.vue';

const router = useRouter();
const auth = useAuthStore();
const phoneRegex = /^(\+?84|0)(3|5|7|8|9)\d{8}$/;

const form = reactive({
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
});

const submit = async () => {
  auth.error = null;

  if (!form.fullName || form.fullName.length < 2) {
    auth.error = 'Họ tên phải có ít nhất 2 ký tự.';
    return;
  }

  if (!form.email) {
    auth.error = 'Email là bắt buộc.';
    return;
  }

  if (!form.phone || !phoneRegex.test(form.phone)) {
    auth.error = 'Số điện thoại không hợp lệ (ví dụ: 0901234567).';
    return;
  }

  if (!form.password || form.password.length < 8) {
    auth.error = 'Mật khẩu phải có ít nhất 8 ký tự.';
    return;
  }

  if (form.password !== form.confirmPassword) {
    auth.error = 'Xác nhận mật khẩu không khớp.';
    return;
  }

  auth.loading = true;
  try {
    await patientApi.register({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
    });
    router.push('/login');
  } catch (error) {
    auth.error = error.message;
  } finally {
    auth.loading = false;
  }
};
</script>
