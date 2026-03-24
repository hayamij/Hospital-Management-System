<template>
  <section class="auth-wrap">
    <div class="auth-card">
      <h1>Create Account</h1>
      <p class="muted">Registration always creates a patient account.</p>

      <form class="form" @submit.prevent="submit">
        <FormField label="Full Name">
          <input v-model.trim="form.fullName" required placeholder="Nguyen Van A" />
        </FormField>

        <FormField label="Email">
          <input v-model.trim="form.email" type="email" required placeholder="user@example.com" />
        </FormField>

        <FormField label="Phone">
          <input v-model.trim="form.phone" type="tel" required placeholder="0901234567" />
        </FormField>

        <FormField label="Password">
          <input v-model="form.password" type="password" required minlength="8" placeholder="At least 8 characters" />
        </FormField>

        <FormField label="Confirm Password">
          <input v-model="form.confirmPassword" type="password" required minlength="8" placeholder="Retype password" />
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
    auth.error = 'Full name must be at least 2 characters.';
    return;
  }

  if (!form.email) {
    auth.error = 'Email is required.';
    return;
  }

  if (!form.phone || !phoneRegex.test(form.phone)) {
    auth.error = 'Phone is invalid (example: 0901234567).';
    return;
  }

  if (!form.password || form.password.length < 8) {
    auth.error = 'Password must be at least 8 characters.';
    return;
  }

  if (form.password !== form.confirmPassword) {
    auth.error = 'Password confirmation does not match.';
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
