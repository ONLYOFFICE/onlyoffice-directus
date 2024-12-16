<template>
	<div v-if="value">
		<iframe :src="`/onlyoffice/editor/${value}?embed=1`"></iframe>
		<VButton target="_blank" :href="`/onlyoffice/editor/${value}?edit=1`" :outlined="true">
			Open in a new tab <VIcon name="open_in_new" />
		</VButton>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		}
	},
	setup(props) {
	},
});
</script>

<style lang="css" scoped>
	iframe {
		border: 0;
		width: 100%;
		height: 50vh;
	}
</style>