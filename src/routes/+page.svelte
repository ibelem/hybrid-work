<script>
	import { onMount } from 'svelte';
	import Header from '../lib/Header.svelte';
	import bannerImage from '$lib/assets/bannerimage.png';

	let nickname;
	let join = () => {
		if (nickname) {
			location.href = `../_gathering/${nickname}`;
		} else {
			location.href = `../_gathering/Anonymous`;
		}
	};
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

<div class="home">
	<Header />
	<main class="container">
		<div class="intro">
			<h2>Gathering with Others</h2>
			<div class="desc">
				Connect, collaborate, and manage your work and life on the Web, powered by emerging Web APIs
				including WebGPU and WebNN API. https://ishadeed.com/article/responsive-design/
			</div>
			<form on:submit|preventDefault={() => join} class="input-group">
				<input
					type="text"
					class="input"
					bind:value={nickname}
					placeholder="Enter a nickname"
					autocomplete="off"
				/>
				<button class="button--submit" href="." on:click={join}>
					Join
					<svg height="48" width="48"
						><path
							d="M24.45 42v-3H39V9H24.45V6H39q1.2 0 2.1.9.9.9.9 2.1v30q0 1.2-.9 2.1-.9.9-2.1.9Zm-3.9-9.25L18.4 30.6l5.1-5.1H6v-3h17.4l-5.1-5.1 2.15-2.15 8.8 8.8Z"
						/></svg
					>
				</button>
			</form>
		</div>
		<div class="right">
			<img src={bannerImage} alt="gathering with others" />
		</div>
	</main>
</div>

<style>
	.container {
		margin: 0 auto;
	}

	.home {
		padding: 8px 24px;
	}
	main {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: 1fr;
		align-items: center;
		justify-items: center;
		grid-column-gap: 2rem;
		height: calc(100vh - 120px);
		padding: 0 2rem;
	}
	.intro {
		display: inline-flex;
		flex-direction: column;
		padding: 1em 0;
		text-align: left;
	}

	.intro h2 {
		font-size: 2.5rem;
		font-weight: 400;
	}
	.desc {
		padding-bottom: 3rem;
	}
	.input-group {
		display: flex;
		align-items: center;
	}

	.input {
		height: 36px;
		max-width: 150px;
		padding: 0 1rem;
		border: 1px solid #5e4dcd;
		border-radius: 6px 0 0 6px;
		background-color: transparent;
	}

	.button--submit {
		height: 37px;
		padding: 0 1rem;
		border: none;
		border-radius: 0 6px 6px 0;
		background-color: #5e4dcd;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		transition: background-color 0.3s ease-in-out;
		display: flex;
		align-items: center;
	}

	.button--submit svg {
		zoom: 0.35;
		margin-left: 1rem;
	}

	.button--submit svg path {
		fill: rgba(255, 255, 255, 0.8);
	}

	.button--submit:hover {
		color: rgba(255, 255, 255, 1);
		background-color: #3e3dad;
	}

	.button--submit:hover svg path {
		fill: rgba(255, 255, 255, 1);
	}

	.input:focus,
	.input:hover,
	.input:focus-visible {
		border-color: #3e3dad;
		outline: none;
	}

	.right {
		justify-self: center;
	}

	.right img {
		max-width: 25vw;
	}

	@media (max-width: 576px) {
		main {
			display: grid;
			grid-template-rows: repeat(2, 1fr);
			grid-template-columns: 1fr;
			padding: 0 1rem;
		}
		.intro {
			display: inline-flex;
			flex-direction: column;
			text-align: center;
		}
		.intro h2,
		.intro .desc {
			text-align: left;
		}
		.input-group {
			justify-content: center;
		}
		.right img {
			max-width: 50vw;
		}
	}
</style>
