<template>
  <section class="auth-wrap">
    <div class="auth-card">
      <h1>Đăng nhập</h1>
      <p class="muted">Đăng nhập bằng email. Vai trò được hệ thống gán.</p>

      <form class="form" @submit.prevent="submit">
        <FormField label="Email">
          <input v-model.trim="form.email" type="email" required placeholder="name@abc.xyz" />
        </FormField>

        <FormField label="Mật khẩu">
          <input v-model="form.password" type="password" required placeholder="Mật khẩu" />
        </FormField>

        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>

      <p class="switch">
        Chưa có tài khoản?
        <RouterLink to="/register">Tạo tài khoản</RouterLink>
      </p>

      <Alert v-if="auth.error" :message="auth.error" />
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import FormField from '../../components/shared/FormField.vue';
import Alert from '../../components/shared/Alert.vue';
import { readAuthPrefill, writeAuthPrefill } from '../../services/sessionStorage.js';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  email: '',
  password: '',
});

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

onMounted(() => {
  const prefill = readAuthPrefill();
  if (!prefill) return;
  if (!form.email) {
    form.email = prefill.email || prefill.identifier || '';
  }
});

const submit = async () => {
  auth.error = null;

  if (!form.email) {
    auth.error = 'Email là bắt buộc.';
    return;
  }

  if (!emailRegex.test(form.email)) {
    auth.error = 'Email không đúng định dạng (ví dụ: name@abc.xyz).';
    return;
  }

  try {
    await auth.login({ email: form.email, password: form.password });
    writeAuthPrefill({
      identifier: form.email,
      email: auth.email || form.email,
      fullName: auth.userProfile?.name || '',
    });
    router.push(auth.defaultRoute);
  } catch {
    // auth.error is set in auth store.
  }
};
</script>

