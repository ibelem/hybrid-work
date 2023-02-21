<script>
	import { browser } from '$app/environment';
	// export let cpState = '0';
	// let cpTitle = 'Start';
	let cpState = 'Init',
		cpTime = '',
		observer;
	const initCP = async () => {
		if (browser) {
			if ('PressureObserver' in window) {
				const pressureObserverCallback = (updates) => {
					cpState = updates[0].state;
					cpTime = updates[0].time;
				};
				observer = new PressureObserver(pressureObserverCallback, { sampleRate: 1 });
				await observer.observe('cpu');
			} else {
				cpState = 'Computer Pressure is not available in your browser';
			}
		}
	};

	// const toggleCP = async () => {
	// 	if (cpTitle === 'Start') {
	// 		cpTitle = 'Stop';
	// 		await observer.observe('cpu');
	// 	} else {
	// 		cpTitle = 'Start';
	// 		await observer.unobserve('cpu');
	// 		// cpState = '';
	// 		// cpTime = '';
	// 	}
	// };

	initCP();
</script>

<!-- <button type="button" on:click={toggleCP}>{cpTitle}</button> -->
<div class="computepressure">
	<div class={cpState}>
		{#if cpState == 'nominal'}
			<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"
				><path
					d="M626 523q22.5 0 38.25-15.75T680 469q0-22.5-15.75-38.25T626 415q-22.5 0-38.25 15.75T572 469q0 22.5 15.75 38.25T626 523Zm-292 0q22.5 0 38.25-15.75T388 469q0-22.5-15.75-38.25T334 415q-22.5 0-38.25 15.75T280 469q0 22.5 15.75 38.25T334 523Zm146 272q66 0 121.5-35.5T682 663h-52q-23 40-63 61.5T480.5 746q-46.5 0-87-21T331 663h-53q26 61 81 96.5T480 795Zm0 181q-83 0-156-31.5T197 859q-54-54-85.5-127T80 576q0-83 31.5-156T197 293q54-54 127-85.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 83-31.5 156T763 859q-54 54-127 85.5T480 976Zm0-400Zm0 340q142.375 0 241.188-98.812Q820 718.375 820 576t-98.812-241.188Q622.375 236 480 236t-241.188 98.812Q140 433.625 140 576t98.812 241.188Q337.625 916 480 916Z"
				/></svg
			>{/if}
		{#if cpState == 'fair'}
			<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"
				><path
					d="M626 523q22.5 0 38.25-15.75T680 469q0-22.5-15.75-38.25T626 415q-22.5 0-38.25 15.75T572 469q0 22.5 15.75 38.25T626 523Zm-292 0q22.5 0 38.25-15.75T388 469q0-22.5-15.75-38.25T334 415q-22.5 0-38.25 15.75T280 469q0 22.5 15.75 38.25T334 523Zm20 194h253v-49H354v49Zm126 259q-83 0-156-31.5T197 859q-54-54-85.5-127T80 576q0-83 31.5-156T197 293q54-54 127-85.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 83-31.5 156T763 859q-54 54-127 85.5T480 976Zm0-400Zm0 340q142.375 0 241.188-98.812Q820 718.375 820 576t-98.812-241.188Q622.375 236 480 236t-241.188 98.812Q140 433.625 140 576t98.812 241.188Q337.625 916 480 916Z"
				/></svg
			>{/if}
		{#if cpState == 'serious'}
			<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"
				><path
					d="M626 523q22.5 0 38.25-15.75T680 469q0-22.5-15.75-38.25T626 415q-22.5 0-38.25 15.75T572 469q0 22.5 15.75 38.25T626 523Zm-292 0q22.5 0 38.25-15.75T388 469q0-22.5-15.75-38.25T334 415q-22.5 0-38.25 15.75T280 469q0 22.5 15.75 38.25T334 523Zm146.174 116Q413 639 358.5 676.5T278 776h53q22-42 62.173-65t87.5-23Q528 688 567.5 711.5T630 776h52q-25-63-79.826-100-54.826-37-122-37ZM480 976q-83 0-156-31.5T197 859q-54-54-85.5-127T80 576q0-83 31.5-156T197 293q54-54 127-85.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 83-31.5 156T763 859q-54 54-127 85.5T480 976Zm0-400Zm0 340q142.375 0 241.188-98.812Q820 718.375 820 576t-98.812-241.188Q622.375 236 480 236t-241.188 98.812Q140 433.625 140 576t98.812 241.188Q337.625 916 480 916Z"
				/></svg
			>{/if}
		{#if cpState == 'critical'}
			<svg height="48" viewBox="0 96 960 960" width="48"
				><path
					d="M480 639q-67 0-121.5 37.5T278 776h404q-25-63-80-100t-122-37Zm-183-72 50-45 45 45 31-36-45-45 45-45-31-36-45 45-50-45-31 36 45 45-45 45 31 36Zm272 0 44-45 51 45 31-36-45-45 45-45-31-36-51 45-44-45-31 36 44 45-44 45 31 36Zm-89 409q-83 0-156-31.5T197 859q-54-54-85.5-127T80 576q0-83 31.5-156T197 293q54-54 127-85.5T480 176q83 0 156 31.5T763 293q54 54 85.5 127T880 576q0 83-31.5 156T763 859q-54 54-127 85.5T480 976Zm0-400Zm0 340q142 0 241-99t99-241q0-142-99-241t-241-99q-142 0-241 99t-99 241q0 142 99 241t241 99Z"
				/></svg
			>{/if}
		{cpState}
	</div>
	<div class="title">Compute Pressure · CPU</div>
</div>

<style>
	.computepressure {
		display: inline-block;
		align-items: center;
		position: fixed;
		bottom: 120px;
		left: 24px;
		text-transform: uppercase;
	}
	.computepressure div {
		border: 1px solid rgba(255, 255, 255, 0.1);
		width: 136px;
	}

	.computepressure div:last-child {
		border: 0;
		font-size: 10px;
		padding: 6px;
	}

	.computepressure div:first-child {
		font-size: 15px;
		padding: 6px;
		align-items: center;
		display: flex;
		justify-content: center;
	}

	.computepressure svg {
		width: 18px;
		height: 18px;
		margin-right: 2px;
	}

	.computepressure svg path {
		fill: rgba(255, 255, 255, 0.8);
	}
	.nominal {
		background: linear-gradient(to right bottom, rgba(0, 128, 32, 0.1), rgba(0, 128, 32, 0.8));
	}
	.nominal:hover {
		background: linear-gradient(to right bottom, rgba(0, 128, 32, 0.5), rgba(0, 128, 32, 1));
	}

	.fair {
		background: linear-gradient(to right bottom, rgba(32, 192, 0, 0.1), rgba(32, 192, 0, 0.8));
	}
	.fair:hover {
		background: linear-gradient(to right bottom, rgba(32, 192, 0, 0.5), rgba(32, 192, 0, 1));
	}
	.serious {
		background: linear-gradient(to right bottom, rgba(192, 128, 0, 0.1), rgba(192, 128, 0, 0.8));
	}
	.serious:hover {
		background: linear-gradient(to right bottom, rgba(192, 128, 0, 0.5), rgba(192, 128, 0, 1));
	}
	.critical {
		background: linear-gradient(to right bottom, rgba(192, 0, 32, 0.1), rgba(192, 0, 32, 0.8));
	}
	.critical:hover {
		background: linear-gradient(to right bottom, rgba(192, 0, 32, 0.5), rgba(192, 0, 32, 1));
	}
</style>
