<template>
	<label class="field">
		<span class="label">{{ label }}</span>
		<slot />
	</label>
</template>

<script setup>
defineProps({
	label: {
		type: String,
		required: true,
	},
});
</script>

<style scoped>
.field {
	display: grid;
	gap: 8px;
	font-weight: 600;
}

.label {
	color: #111827;
}
</style>
