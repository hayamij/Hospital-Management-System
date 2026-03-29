<template>
  <section class="panel">
    <h2>Đổi mật khẩu</h2>
    <form class="grid two-col" @submit.prevent="$emit('submit')">
      <label class="field full-row">
        <span>Mật khẩu hiện tại</span>
        <input
          v-model="form.currentPassword"
          type="password"
          placeholder="Nhập mật khẩu hiện tại"
          @blur="$emit('touch-field', 'currentPassword')"
        />
        <small v-if="showPasswordError('currentPassword')" class="field-error">{{ errors.currentPassword }}</small>
      </label>

      <label class="field">
        <span>Mật khẩu mới</span>
        <input
          v-model="form.newPassword"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          @blur="$emit('touch-field', 'newPassword')"
        />
        <small v-if="showPasswordError('newPassword')" class="field-error">{{ errors.newPassword }}</small>
      </label>

      <label class="field">
        <span>Xác nhận mật khẩu mới</span>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          @blur="$emit('touch-field', 'confirmPassword')"
        />
        <small v-if="showPasswordError('confirmPassword')" class="field-error">{{ errors.confirmPassword }}</small>
      </label>

      <div class="full-row actions">
        <button type="submit" :disabled="submitting">Đổi mật khẩu</button>
      </div>
    </form>

    <p v-if="success" class="msg ok">{{ success }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </section>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
  showPasswordError: { type: Function, required: true },
  submitting: { type: Boolean, default: false },
  success: { type: String, default: '' },
  error: { type: String, default: '' },
});

defineEmits(['submit', 'touch-field']);
</script>

<style scoped>
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
