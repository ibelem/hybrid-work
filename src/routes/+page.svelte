<script>
	import { onMount } from 'svelte';
	import Header from '../lib/Header.svelte';

	onMount(() => {
		// Face.solve(facelandmarkArray, {
		// 	runtime: 'tfjs', // `mediapipe` or `tfjs`
		// 	video: video,
		// 	imageSize: { height: 720, width: 480 },
		// 	smoothBlink: false, // smooth left and right eye blink delays
		// 	blinkSettings: [0.25, 0.75] // adjust upper and lower bound blink sensitivity
		// });
	});
</script>

<div>
	<Header />
	<div>
		<a href="_meet">meet page</a>
	</div>
</div>

<style>
</style>
