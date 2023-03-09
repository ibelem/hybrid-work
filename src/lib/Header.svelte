<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Logo from '$lib/assets/Logo.svelte';
	import Account from '$lib/assets/Account.svelte';
	import { getDay, getTime } from '../js/client/utils.js';
	let path, classname;
	let day, time;
	export let nickname;
	onMount(() => {
		if (browser) {
			const interval = setInterval(() => {
				day = getDay();
				time = getTime();
			}, 60);
			path = new URL(window.location).pathname.indexOf('/_gathering/');
		}
		if (!nickname) {
			nickname = '';
		}

		path > -1 ? (classname = 'white') : (classname = 'normal');
	});
</script>

<header class={classname}>
	<div class="logo">
		<a href="../"><Logo /></a>
	</div>
	<div class="info">
		<div class="time">
			{time} · {day}
		</div>
		<div class="signin">
			{#if nickname}<span>{nickname}</span>{/if}
			<Account />
		</div>
	</div>
</header>

<style>
	header {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: 1fr;
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		align-items: center;
		padding: 8px 0;
	}
	.info {
		justify-self: right;
		align-items: center;
		display: flex;
	}

	.logo {
		justify-self: left;
	}

	.signin {
		margin-left: 8px;
		justify-self: right;
		display: flex;
		align-items: center;
	}
	.signin span {
		margin-right: 8px;
		max-width: 180px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	@media (max-width: 576px) {
		header {
			display: grid;
			grid-template-rows: repeat(2, 1fr);
			grid-template-columns: 1fr;
		}
		.signin,
		.info {
			justify-self: center;
		}
	}
</style>
