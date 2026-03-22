<template>
  <div class="panel">
    <h3>Filter</h3>
    <form class="form form--inline" @submit.prevent>
      <input v-model="localFilter.patientId" placeholder="Patient ID" @input="emitChange" />
      <input v-model="localFilter.doctorId" placeholder="Doctor ID" @input="emitChange" />
    </form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ patientId: '', doctorId: '' }),
  },
});
const emit = defineEmits(['update:modelValue', 'change']);

const localFilter = reactive({ ...props.modelValue });

const emitChange = () => {
  emit('update:modelValue', { ...localFilter });
  emit('change', { ...localFilter });
};

watch(
  () => ({ ...props.modelValue }),
  (val) => Object.assign(localFilter, val)
);
</script>
