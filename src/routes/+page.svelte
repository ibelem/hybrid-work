<script>
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	let date = new Date();

	let padNumber = (num, fill) => {
		var len = ('' + num).length;
		return Array(fill > len ? fill - len + 1 || 0 : 0).join(0) + num;
	};

	$: hour = padNumber(date.getHours(), 2);
	$: min = padNumber(date.getMinutes(), 2);
	$: sec = padNumber(date.getSeconds(), 2);
	$: millisec = date.getMilliseconds().toString().substring(0, 2);

	onMount(() => {
		if (browser) {
			const interval = setInterval(() => {
				date = new Date();
			}, 1);

			// Face.solve(facelandmarkArray, {
			// 	runtime: 'tfjs', // `mediapipe` or `tfjs`
			// 	video: video,
			// 	imageSize: { height: 720, width: 480 },
			// 	smoothBlink: false, // smooth left and right eye blink delays
			// 	blinkSettings: [0.25, 0.75] // adjust upper and lower bound blink sensitivity
			// });
		}
	});
</script>

<div>
	<div>
		<img id="logo" src="img/logo.svg" alt="Logo" />
	</div>

	<div>
		<a href="_meet">meet page</a>
	</div>
	<br />
	<div>
		{hour}:{min}:{sec}:{millisec}
	</div>
</div>

<style>
	#logo {
		width: 180px;
		height: 40px;
	}
</style>
