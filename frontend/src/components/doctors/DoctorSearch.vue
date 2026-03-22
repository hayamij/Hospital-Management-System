<template>
  <div class="panel">
    <h3>Search Doctors</h3>
    <form class="form form--inline" @submit.prevent>
      <input v-model="query" placeholder="Name or specialty" @input="emitChange" />
    </form>
    <ul class="list">
      <li v-for="doc in doctors" :key="doc.id">
        <strong>{{ doc.name }}</strong> — {{ doc.specialty }} ({{ doc.id }})
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ doctors: { type: Array, default: () => [] }, modelValue: String });
const emit = defineEmits(['update:modelValue', 'change']);
const query = ref(props.modelValue ?? '');
const emitChange = () => { emit('update:modelValue', query.value); emit('change', query.value); };
watch(() => props.modelValue, (v) => { if (v !== query.value) query.value = v ?? ''; });
</script>
