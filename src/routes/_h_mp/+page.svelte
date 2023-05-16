<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	onMount(async () => {
		if (browser) {
			location.href = '../';
		}
	});
</script>
