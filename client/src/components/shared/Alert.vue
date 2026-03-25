<template>
	<p class="msg" :class="variantClass">
		<slot>{{ message }}</slot>
	</p>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
	message: {
		type: String,
		default: '',
	},
	variant: {
		type: String,
		default: 'err',
	},
});

const variantClass = computed(() => {
	return props.variant === 'ok' ? 'ok' : 'err';
});
</script>
