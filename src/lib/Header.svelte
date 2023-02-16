<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import logo from '$lib/assets/logo.svg';
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
		}
	});
</script>

<header>
	<div class="logo">
		<a href="../"><img id="logo" src={logo} alt="Logo" /></a>
	</div>
	<div class="info">
		<div class="time">
			{hour}:{min}:{sec} • {day}, {m}
			{d}
		</div>
		<div class="signin">
			<img src="" alt="a random avatar" />
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
	#logo {
		width: 160px;
		height: 36px;
	}
	.signin {
		margin-left: 8px;
		justify-self: right;
	}
	.signin img {
		--f: 1;
		width: 32px;
		aspect-ratio: 1;
		cursor: pointer;
		border-radius: 999px 999px 999px 999px;
		border-width: 0px;
		border-style: solid;
		transform: scale(var(--f));
		transition: 0.5s;
	}
	.signin img:hover {
		--f: 1.25;
	}

	@media (max-width: 576px) {
		header {
			display: grid;
			grid-template-rows: repeat(2, 1fr);
			grid-template-columns: 1fr;
		}
		.signin {
			justify-self: center;
		}
	}
</style>
