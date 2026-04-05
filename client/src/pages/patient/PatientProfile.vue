<template>
  <div class="profile-page">
    <PatientProfileInfoForm
      :form="profileForm"
      :errors="profileErrors"
      :show-field-error="showFieldError"
      :loading="patients.loading"
      :success="profileSuccess"
      :error="patients.error"
      @submit="submitProfile"
      @touch-field="touchField"
    />

    <PatientPasswordChangeForm
      :form="passwordForm"
      :errors="passwordErrors"
      :show-password-error="showPasswordError"
      :submitting="passwordSubmitting"
      :success="passwordSuccess"
      :error="passwordError"
      @submit="submitPassword"
      @touch-field="touchPasswordField"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { authApi } from '../../services/api.js';
import { usePatientsStore } from '../../stores/patients.js';
import { useAuthStore } from '../../stores/auth.js';
import { readAuthPrefill } from '../../services/sessionStorage.js';
import PatientProfileInfoForm from '../../components/patient/PatientProfileInfoForm.vue';
import PatientPasswordChangeForm from '../../components/patient/PatientPasswordChangeForm.vue';

const auth = useAuthStore();
const patients = usePatientsStore();

const profileForm = reactive({
  name: '',
  phone: '',
  address: '',
  allergies: '',
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const profileTouched = reactive({
  name: false,
  phone: false,
  address: false,
  allergies: false,
});

const passwordTouched = reactive({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
});

const profileSubmitted = ref(false);
const passwordSubmitted = ref(false);
const passwordSubmitting = ref(false);

const profileSuccess = ref('');
const passwordSuccess = ref('');
const passwordError = ref('');

const phoneRegex = /^(\+?84|0)(3|5|7|8|9)\d{8}$/;

const profileErrors = computed(() => {
  const errors = {};

  if (!profileForm.name || profileForm.name.length < 2) {
    errors.name = 'Tên phải có ít nhất 2 ký tự.';
  }

  if (!profileForm.phone || !phoneRegex.test(profileForm.phone)) {
    errors.phone = 'SĐT không hợp lệ (ví dụ: 0901234567).';
  }

  if (!profileForm.address || profileForm.address.length < 5) {
    errors.address = 'Địa chỉ phải có ít nhất 5 ký tự.';
  }

  if (profileForm.allergies.length > 500) {
    errors.allergies = 'Tiền sử dị ứng không được vượt quá 500 ký tự.';
  }

  return errors;
});

const passwordErrors = computed(() => {
  const errors = {};

  if (!passwordForm.currentPassword) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  }

  if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
    errors.newPassword = 'Mật khẩu mới phải tối thiểu 8 ký tự.';
  } else if (!/[A-Z]/.test(passwordForm.newPassword) || !/[a-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
    errors.newPassword = 'Mật khẩu mới cần có chữ hoa, chữ thường và số.';
  }

  if (!passwordForm.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    errors.confirmPassword = 'Xác nhận mật khẩu không khớp.';
  }

  return errors;
});

const touchField = (field) => {
  profileTouched[field] = true;
};

const touchPasswordField = (field) => {
  passwordTouched[field] = true;
};

const showFieldError = (field) => (profileTouched[field] || profileSubmitted.value) && profileErrors.value[field];
const showPasswordError = (field) => (passwordTouched[field] || passwordSubmitted.value) && passwordErrors.value[field];

const syncProfileForm = () => {
  const prefill = readAuthPrefill() || {};
  profileForm.name = patients.profile?.name || auth.userProfile?.name || prefill.fullName || '';
  profileForm.phone = patients.profile?.phone || prefill.phone || '';
  profileForm.address = patients.profile?.address || prefill.address || '';
  profileForm.allergies = patients.profile?.allergies || prefill.allergies || '';
};

const submitProfile = async () => {
  profileSubmitted.value = true;
  profileSuccess.value = '';

  if (Object.keys(profileErrors.value).length > 0) {
    return;
  }

  try {
    await patients.updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      address: profileForm.address,
      allergies: profileForm.allergies,
    });
    syncProfileForm();
    profileSuccess.value = 'Cập nhật thông tin cá nhân thành công.';
  } catch {
    profileSuccess.value = '';
  }
};

const submitPassword = async () => {
  passwordSubmitted.value = true;
  passwordError.value = '';
  passwordSuccess.value = '';

  if (Object.keys(passwordErrors.value).length > 0) {
    return;
  }

  passwordSubmitting.value = true;
  try {
    await authApi.resetPassword({
      email: auth.email,
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    passwordSuccess.value = 'Đổi mật khẩu thành công.';
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordSubmitted.value = false;
    passwordTouched.currentPassword = false;
    passwordTouched.newPassword = false;
    passwordTouched.confirmPassword = false;
  } catch (error) {
    passwordError.value = error?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
  } finally {
    passwordSubmitting.value = false;
  }
};

onMounted(async () => {
  await auth.fetchCurrentUser();
  try {
    await patients.loadProfile();
  } catch {
    // Keep fallback values from auth store when profile endpoint is temporarily unavailable.
  }
  syncProfileForm();
});
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 20px;
}
</style>

