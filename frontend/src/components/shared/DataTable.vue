<template>
  <div class="panel">
    <h3 v-if="title">{{ title }}</h3>
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row[idField] ?? JSON.stringify(row)">
          <td v-for="col in columns" :key="col.key">
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  idField: { type: String, default: 'id' },
});
</script>

<style scoped>
.panel { padding: 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.5rem; border-bottom: 1px solid #e2e8f0; text-align: left; }
</style>
