<template>
  <section class="auth-wrap">
    <div class="auth-card">
      <h1>Đăng nhập</h1>
      <p class="muted">Đăng nhập bằng tài khoản. Vai trò được hệ thống gán.</p>

      <form class="form" @submit.prevent="submit">
        <FormField label="Tài khoản">
          <input v-model="form.identifier" required placeholder="Email hoặc tên đăng nhập" />
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
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import FormField from '../components/shared/FormField.vue';
import Alert from '../components/shared/Alert.vue';

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  identifier: '',
  password: '',
});

const submit = async () => {
  await auth.login(form);
  router.push(auth.defaultRoute);
};
</script>
