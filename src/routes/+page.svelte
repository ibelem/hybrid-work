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
				including Windows Effects Package based Intelligent collaboration API and WebNN API.
			</div>
			<form on:submit|preventDefault={() => join} class="input-group">
				<input
					type="text"
					class="input"
					bind:value={nickname}
					placeholder="Enter a nickname"
					autocomplete="off"
				/>

				<button class="join" href="." on:click={join}>
					<span>
						<span aria-hidden="true">
							<svg height="48" viewBox="0 96 960 960" width="48"
								><path
									d="M489 936v-60h291V276H489v-60h291q24 0 42 18t18 42v600q0 24-18 42t-42 18H489Zm-78-185-43-43 102-102H120v-60h348L366 444l43-43 176 176-174 174Z"
								/></svg
							>
						</span>
						<span>Join</span>
						<span aria-hidden="true">
							<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
								/>
							</svg>
						</span>
					</span>
				</button>
			</form>
		</div>
		<div class="right">
			<img src={bannerImage} alt="gathering with others" />
		</div>
	</main>
</div>

<style>
	:root {
		--transition: 0.28s;
		--font-size: 1.2rem;
	}

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
		height: calc(100vh - 140px);
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
		height: 46px;
		max-width: 180px;
		padding: 0 1rem;
		border: 1px solid var(--energyblue);
		border-radius: 6px 0 0 6px;
		background-color: transparent;
		font-size: 1.2rem;
	}

	::placeholder {
		color: rgba(0, 0, 0, 0.4);
	}

	.input:focus::placeholder {
		color: rgba(0, 0, 0, 0);
	}

	.join {
		outline-color: var(--energyblue);
		--padding: calc(var(--font-size) * 0.75);
		font-size: 1.2rem;
		cursor: pointer;
		background: var(--energyblue);
		border-radius: 0 6px 6px 0;
		border: 1px solid var(--energyblue);
		color: #fff;
		position: relative;
		transition: border-color var(--transition);
		width: 120px;
		height: 48px;
	}

	.join > span {
		overflow: hidden;
		display: grid;
		grid-template-columns:
			calc((var(--font-size) * 1.75) * (1 - var(--hovered, 0)))
			1fr
			calc((var(--font-size) * 1.75) * var(--hovered, 0));
		align-items: center;
		transition: grid-template-columns var(--transition);
	}

	.join:after {
		content: '';
		position: absolute;
		inset: calc(var(--font-size) * -0.025);
		background: var(--classicblue);
		filter: blur(calc(var(--font-size) * 0.75));
		scale: var(--hovered, 0);
		z-index: -1;
		transition: scale var(--transition);
	}

	.join:hover {
		--hovered: 1;
	}

	.input-group:hover .join {
		background: var(--classicblue);
	}

	.input-group:hover .input,
	.input-group:hover .join {
		border-color: var(--classicblue);
	}

	.join svg {
		max-height: 38px;
		transition: translate var(--transition) ease-in-out, opacity var(--transition) ease-in-out;
	}

	.join svg path {
		fill: var(--white);
	}

	.join:is(:focus-visible, :hover) {
		--hovered: 1;
	}

	.join span span:nth-of-type(3) svg {
		stroke-width: 3;
		translate: calc((1 - var(--hovered, 0)) * (var(--font-size) * 3)) 8%;
		width: calc(var(--font-size) * 1);
		opacity: var(--hovered, 0);
	}

	.join span span:nth-of-type(1) svg {
		stroke-width: 3;
		translate: calc(((var(--hovered, 0) * var(--font-size)) * -3) + 10%) 8%;
		width: calc(var(--font-size) * 1.4);
	}

	.input:focus,
	.input:hover,
	.input:focus-visible {
		border-color: var(--classicblue);
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
