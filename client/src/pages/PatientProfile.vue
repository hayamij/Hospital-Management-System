<template>
  <div class="profile-page">
    <section class="panel">
      <h1>Thông tin cá nhân</h1>
      <p>Cập nhật hồ sơ bệnh nhân trước khi đặt lịch để nhận tư vấn chính xác hơn.</p>

      <form class="grid two-col" @submit.prevent="submitProfile">
        <label class="field">
          <span>Tên</span>
          <input
            v-model.trim="profileForm.name"
            type="text"
            placeholder="Nguyen Van A"
            @blur="touchField('name')"
          />
          <small v-if="showFieldError('name')" class="field-error">{{ profileErrors.name }}</small>
        </label>

        <label class="field">
          <span>SĐT</span>
          <input
            v-model.trim="profileForm.phone"
            type="text"
            placeholder="0901234567"
            @blur="touchField('phone')"
          />
          <small v-if="showFieldError('phone')" class="field-error">{{ profileErrors.phone }}</small>
        </label>

        <label class="field full-row">
          <span>Địa chỉ</span>
          <input
            v-model.trim="profileForm.address"
            type="text"
            placeholder="123 Đường ABC, Quận 1, TP.HCM"
            @blur="touchField('address')"
          />
          <small v-if="showFieldError('address')" class="field-error">{{ profileErrors.address }}</small>
        </label>

        <label class="field full-row">
          <span>Tiền sử dị ứng</span>
          <textarea
            v-model.trim="profileForm.allergies"
            rows="4"
            placeholder="Ví dụ: dị ứng penicillin, hải sản..."
            @blur="touchField('allergies')"
          ></textarea>
          <small v-if="showFieldError('allergies')" class="field-error">{{ profileErrors.allergies }}</small>
        </label>

        <div class="full-row actions">
          <button type="submit" :disabled="patients.loading">Lưu thông tin</button>
        </div>
      </form>

      <p v-if="profileSuccess" class="msg ok">{{ profileSuccess }}</p>
      <p v-if="patients.error" class="msg err">{{ patients.error }}</p>
    </section>

    <section class="panel">
      <h2>Đổi mật khẩu</h2>
      <form class="grid two-col" @submit.prevent="submitPassword">
        <label class="field full-row">
          <span>Mật khẩu hiện tại</span>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="Nhập mật khẩu hiện tại"
            @blur="touchPasswordField('currentPassword')"
          />
          <small v-if="showPasswordError('currentPassword')" class="field-error">{{ passwordErrors.currentPassword }}</small>
        </label>

        <label class="field">
          <span>Mật khẩu mới</span>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            @blur="touchPasswordField('newPassword')"
          />
          <small v-if="showPasswordError('newPassword')" class="field-error">{{ passwordErrors.newPassword }}</small>
        </label>

        <label class="field">
          <span>Xác nhận mật khẩu mới</span>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            @blur="touchPasswordField('confirmPassword')"
          />
          <small v-if="showPasswordError('confirmPassword')" class="field-error">{{ passwordErrors.confirmPassword }}</small>
        </label>

        <div class="full-row actions">
          <button type="submit" :disabled="passwordSubmitting">Đổi mật khẩu</button>
        </div>
      </form>

      <p v-if="passwordSuccess" class="msg ok">{{ passwordSuccess }}</p>
      <p v-if="passwordError" class="msg err">{{ passwordError }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { authApi } from '../services/api.js';
import { usePatientsStore } from '../stores/patients.js';
import { useAuthStore } from '../stores/auth.js';

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

const submitProfile = async () => {
  profileSubmitted.value = true;
  profileSuccess.value = '';

  if (Object.keys(profileErrors.value).length > 0) {
    return;
  }

  await patients.updateProfile({
    name: profileForm.name,
    phone: profileForm.phone,
    address: profileForm.address,
    allergies: profileForm.allergies,
  });

  profileSuccess.value = 'Cập nhật thông tin cá nhân thành công.';
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

onMounted(() => {
  auth.fetchCurrentUser();

  profileForm.name = patients.profile?.name || auth.userProfile?.name || '';
  profileForm.phone = patients.profile?.phone || '';
  profileForm.address = patients.profile?.address || '';
  profileForm.allergies = patients.profile?.allergies || '';
});
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: 20px;
}

.two-col {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.full-row {
  grid-column: 1 / -1;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #334155;
  font-weight: 600;
}

.field-error {
  color: #b91c1c;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-start;
}
</style>
