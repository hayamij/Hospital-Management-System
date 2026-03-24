<template>
  <section class="auth-wrap">
    <div class="auth-card">
      <h1>Sign In</h1>
      <p class="muted">Sign in with your account. Role is assigned by the system.</p>

      <form class="form" @submit.prevent="submit">
        <FormField label="Account">
          <input v-model="form.identifier" required placeholder="Email or username" />
        </FormField>

        <FormField label="Password">
          <input v-model="form.password" type="password" required placeholder="Password" />
        </FormField>

        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <p class="switch">
        No account?
        <RouterLink to="/register">Create one</RouterLink>
      </p>

      <p class="switch">
        Need endpoint-by-endpoint testing?
        <RouterLink to="/usecases">Open Use Cases Console</RouterLink>
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
