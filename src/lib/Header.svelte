<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Logo from '$lib/assets/Logo.svelte';
	import Account from '$lib/assets/Account.svelte';
	let path, classname;
	export let nickname;
	let date = new Date();

	let padNumber = (num, fill) => {
		var len = ('' + num).length;
		return Array(fill > len ? fill - len + 1 || 0 : 0).join(0) + num;
	};

	const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const month = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	$: day = week[date.getDay()];
	$: m = month[date.getMonth()];
	$: d = padNumber(date.getDate(), 2);
	$: hour = padNumber(date.getHours(), 2);
	$: min = padNumber(date.getMinutes(), 2);
	$: sec = padNumber(date.getSeconds(), 2);
	// $: millisec = date.getMilliseconds().toString().substring(0, 2);

	onMount(() => {
		if (browser) {
			const interval = setInterval(() => {
				date = new Date();
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
			{hour}:{min}:{sec} · {day}, {m}
			{d}
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
