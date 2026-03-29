<template>
  <section class="panel">
    <h1>Thông tin cá nhân</h1>
    <p>Cập nhật hồ sơ bệnh nhân trước khi đặt lịch để nhận tư vấn chính xác hơn.</p>

    <form class="grid two-col" @submit.prevent="$emit('submit')">
      <label class="field">
        <span>Tên</span>
        <input
          v-model.trim="form.name"
          type="text"
          placeholder="Nguyen Van A"
          @blur="$emit('touch-field', 'name')"
        />
        <small v-if="showFieldError('name')" class="field-error">{{ errors.name }}</small>
      </label>

      <label class="field">
        <span>SĐT</span>
        <input
          v-model.trim="form.phone"
          type="text"
          placeholder="0901234567"
          @blur="$emit('touch-field', 'phone')"
        />
        <small v-if="showFieldError('phone')" class="field-error">{{ errors.phone }}</small>
      </label>

      <label class="field full-row">
        <span>Địa chỉ</span>
        <input
          v-model.trim="form.address"
          type="text"
          placeholder="123 Đường ABC, Quận 1, TP.HCM"
          @blur="$emit('touch-field', 'address')"
        />
        <small v-if="showFieldError('address')" class="field-error">{{ errors.address }}</small>
      </label>

      <label class="field full-row">
        <span>Tiền sử dị ứng</span>
        <textarea
          v-model.trim="form.allergies"
          rows="4"
          placeholder="Ví dụ: dị ứng penicillin, hải sản..."
          @blur="$emit('touch-field', 'allergies')"
        ></textarea>
        <small v-if="showFieldError('allergies')" class="field-error">{{ errors.allergies }}</small>
      </label>

      <div class="full-row actions">
        <button type="submit" :disabled="loading">Lưu thông tin</button>
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
  showFieldError: { type: Function, required: true },
  loading: { type: Boolean, default: false },
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
