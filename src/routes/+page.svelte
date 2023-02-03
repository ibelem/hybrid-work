<script>
	import { browser } from '$app/environment';
	import { Face } from 'kalidokit';
	import { onMount } from 'svelte';
	let date = new Date();

	let inputvideo;
	let resolution = { width: 1280, height: 720 };
	let avTrackConstraint = {
		audio: {
			source: 'mic'
		},
		video: {
			resolution: resolution,
			frameRate: 24,
			source: 'camera'
		}
	};
	let stream;

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

			const createOWTStream = async () => {
				stream = await Owt.Base.MediaStreamFactory.createMediaStream(avTrackConstraint);
				if ('srcObject' in inputvideo) {
					inputvideo.srcObject = stream;
				} else {
					inputvideo.src = URL.createObjectURL(stream);
				}

				inputvideo.autoplay = true;
				console.log(inputvideo.srcObject);
			};

			const initConference = () => {
				createToken(roomId, localname, 'presenter', function (response) {
					let token = response;
					if (!room) {
						room = new Owt.Conference.ConferenceClient();
						addRoomEventListener();
					}
				});
			};

			const oneWebMeetOWT = async () => {
				await createOWTStream();
			};

			oneWebMeetOWT();
		}
	});
</script>

<div>
	<div>
		<img id="logo" src="img/logo.svg" alt="Logo" />
	</div>

	<video width="720" height="480" bind:this={inputvideo}>
		<track kind="captions" />
	</video>
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
