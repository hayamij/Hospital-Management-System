<template>
  <section class="auth-wrap">
    <div class="auth-card">
      <h1>Create Account</h1>
      <p class="muted">Registration always creates a patient account.</p>

      <form class="form" @submit.prevent="submit">
        <FormField label="Full Name">
          <input v-model="form.fullName" required />
        </FormField>

        <FormField label="Email">
          <input v-model="form.email" type="email" required />
        </FormField>

        <FormField label="Password">
          <input v-model="form.password" type="password" required />
        </FormField>

        <button type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Creating...' : 'Create Account' }}
        </button>
      </form>

      <p class="switch">
        Already have an account?
        <RouterLink to="/login">Sign in</RouterLink>
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

const form = reactive({
  fullName: '',
  email: '',
  password: '',
});

const submit = async () => {
  auth.error = null;
  auth.loading = true;
  try {
    await patientApi.register(form);
    router.push('/login');
  } catch (error) {
    auth.error = error.message;
  } finally {
    auth.loading = false;
  }
};
</script>
