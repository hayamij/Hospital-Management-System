<template>
  <div class="profile-page">
    <section class="panel">
      <h1>Thong tin ca nhan</h1>
      <p>Cap nhat ho so benh nhan truoc khi dat lich de nhan tu van chinh xac hon.</p>

      <form class="grid two-col" @submit.prevent="submitProfile">
        <label class="field">
          <span>Ten</span>
          <input
            v-model.trim="profileForm.name"
            type="text"
            placeholder="Nguyen Van A"
            @blur="touchField('name')"
          />
          <small v-if="showFieldError('name')" class="field-error">{{ profileErrors.name }}</small>
        </label>

        <label class="field">
          <span>SDT</span>
          <input
            v-model.trim="profileForm.phone"
            type="text"
            placeholder="0901234567"
            @blur="touchField('phone')"
          />
          <small v-if="showFieldError('phone')" class="field-error">{{ profileErrors.phone }}</small>
        </label>

        <label class="field full-row">
          <span>Dia chi</span>
          <input
            v-model.trim="profileForm.address"
            type="text"
            placeholder="123 Duong ABC, Quan 1, TP.HCM"
            @blur="touchField('address')"
          />
          <small v-if="showFieldError('address')" class="field-error">{{ profileErrors.address }}</small>
        </label>

        <label class="field full-row">
          <span>Tien su di ung</span>
          <textarea
            v-model.trim="profileForm.allergies"
            rows="4"
            placeholder="Vi du: di ung penicillin, hai san..."
            @blur="touchField('allergies')"
          ></textarea>
          <small v-if="showFieldError('allergies')" class="field-error">{{ profileErrors.allergies }}</small>
        </label>

        <div class="full-row actions">
          <button type="submit" :disabled="patients.loading">Luu thong tin</button>
        </div>
      </form>

      <p v-if="profileSuccess" class="msg ok">{{ profileSuccess }}</p>
      <p v-if="patients.error" class="msg err">{{ patients.error }}</p>
    </section>

    <section class="panel">
      <h2>Doi mat khau</h2>
      <form class="grid two-col" @submit.prevent="submitPassword">
        <label class="field full-row">
          <span>Mat khau hien tai</span>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="Nhap mat khau hien tai"
            @blur="touchPasswordField('currentPassword')"
          />
          <small v-if="showPasswordError('currentPassword')" class="field-error">{{ passwordErrors.currentPassword }}</small>
        </label>

        <label class="field">
          <span>Mat khau moi</span>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="Toi thieu 8 ky tu"
            @blur="touchPasswordField('newPassword')"
          />
          <small v-if="showPasswordError('newPassword')" class="field-error">{{ passwordErrors.newPassword }}</small>
        </label>

        <label class="field">
          <span>Xac nhan mat khau moi</span>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="Nhap lai mat khau moi"
            @blur="touchPasswordField('confirmPassword')"
          />
          <small v-if="showPasswordError('confirmPassword')" class="field-error">{{ passwordErrors.confirmPassword }}</small>
        </label>

        <div class="full-row actions">
          <button type="submit" :disabled="passwordSubmitting">Doi mat khau</button>
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
    errors.name = 'Ten phai co it nhat 2 ky tu.';
  }

  if (!profileForm.phone || !phoneRegex.test(profileForm.phone)) {
    errors.phone = 'SDT khong hop le (vi du: 0901234567).';
  }

  if (!profileForm.address || profileForm.address.length < 5) {
    errors.address = 'Dia chi phai co it nhat 5 ky tu.';
  }

  if (profileForm.allergies.length > 500) {
    errors.allergies = 'Tien su di ung khong duoc vuot qua 500 ky tu.';
  }

  return errors;
});

const passwordErrors = computed(() => {
  const errors = {};

  if (!passwordForm.currentPassword) {
    errors.currentPassword = 'Vui long nhap mat khau hien tai.';
  }

  if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
    errors.newPassword = 'Mat khau moi phai toi thieu 8 ky tu.';
  } else if (!/[A-Z]/.test(passwordForm.newPassword) || !/[a-z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
    errors.newPassword = 'Mat khau moi can co chu hoa, chu thuong va so.';
  }

  if (!passwordForm.confirmPassword) {
    errors.confirmPassword = 'Vui long xac nhan mat khau moi.';
  } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    errors.confirmPassword = 'Xac nhan mat khau khong khop.';
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

  profileSuccess.value = 'Cap nhat thong tin ca nhan thanh cong.';
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

    passwordSuccess.value = 'Doi mat khau thanh cong.';
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordSubmitted.value = false;
    passwordTouched.currentPassword = false;
    passwordTouched.newPassword = false;
    passwordTouched.confirmPassword = false;
  } catch (error) {
    passwordError.value = error?.message || 'Khong the doi mat khau. Vui long thu lai.';
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
