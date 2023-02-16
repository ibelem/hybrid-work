<script>
	import { browser } from '$app/environment';
	import Header from '../../../lib/Header.svelte';
	import Control from '../../../lib/Control.svelte';
	// import { Face } from 'kalidokit';
	import { onMount } from 'svelte';
	/** @type {import('./$types').PageData} */
	export let data;
	import {
		send,
		generateUrl,
		onResponse,
		mixStream,
		deleteStream,
		createToken,
		getStreams,
		pauseStream,
		playStream
	} from '../../../js/client/rest';

	let error = null;

	let camera, inputVideo, outputCanvas, ctx;
	let cW, cH;
	let br = false;
	let bb = false;
	let pauseAudio = true;
	let pauseVideo = false;
	let beauty = false;

	let backgroundImage, backgroundPause;
	let gatheringContainer, controlPanel;
	let column;
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

	let room = null,
		pc,
		videotransceiver,
		audiotransceiver,
		roomId,
		myid,
		localname = 'user';
	let start,
		end,
		delta,
		inference,
		inferencedata = 0;
	let localPublication = null;
	let localId = null;
	let users = [];
	let stream, processedStream, localStream;
	let audioOnly = false;
	let localScreen, localScreenId, localScreenPubliction;
	let screenSharing = false;
	let remoteScreen = null;
	let remoteScreenName = null;

	const cl = (msg) => {
		console.log(msg);
	};

	const toggleBeauty = () => {
		beauty = !beauty;
	};

	onMount(async () => {
		if (browser) {
			let gatheringContainerChildCount = gatheringContainer.childElementCount;
			gatheringContainerChildCount > 4
				? (column = 'grid5')
				: (column = 'grid' + gatheringContainer.childElementCount);

			// Face.solve(facelandmarkArray, {
			// 	runtime: 'tfjs', // `mediapipe` or `tfjs`
			// 	video: video,
			// 	imageSize: { height: 720, width: 480 },
			// 	smoothBlink: false, // smooth left and right eye blink delays
			// 	blinkSettings: [0.25, 0.75] // adjust upper and lower bound blink sensitivity
			// });

			// const createOWTStream = async () => {
			// 	stream = await Owt.Base.MediaStreamFactory.createMediaStream(avTrackConstraint);
			// 	if ('srcObject' in inputVideo) {
			// 		inputVideo.srcObject = stream;
			// 	} else {
			// 		inputVideo.src = URL.createObjectURL(stream);
			// 	}

			// 	inputVideo.autoplay = true;
			// 	cl(inputVideo.srcObject);
			// };

			const mediaPipeStream = () => {
				camera = new Camera(inputVideo, {
					onFrame: async () => {
						await selfieSegmentation.send({ image: inputVideo });
					},
					onSourceChanged: async () => {
						await selfieSegmentation.reset();
					},
					width: resolution.width,
					height: resolution.height
				});
			};

			const onBRResults = (results) => {
				cW = outputCanvas.width;
				cH = outputCanvas.height;
				cl('-=====================');
				cl(beauty);
				if (pauseVideo) {
					ctx.drawImage(backgroundPause, 0, 0, cW, cH);
				} else {
					if (!bb && !br) {
						ctx.drawImage(results.image, 0, 0, cW, cH);
						if (beauty) {
							ctx.filter = 'saturate(105%) brightness(120%) contrast(110%) blur(1px)';
						} else {
							ctx.filter = 'saturate(100%) brightness(100%) contrast(100%) blur(0px)';
						}
					} else {
						end = performance.now();
						if (start) {
							delta = end - start;
							inferencedata = delta.toFixed(1);
						}

						fpsControl.tick();

						ctx.save();
						ctx.clearRect(0, 0, cW, cH);
						ctx.drawImage(results.segmentationMask, 0, 0, cW, cH);

						// Only overwrite existing pixels.
						ctx.globalCompositeOperation = 'source-in';

						if (beauty) {
							ctx.filter = 'saturate(105%) brightness(120%) contrast(110%) blur(0px)';
						}

						ctx.drawImage(results.image, 0, 0, cW, cH);
						ctx.globalCompositeOperation = 'destination-atop';

						if (bb && br) {
							ctx.filter = 'blur(10px)';
							ctx.drawImage(backgroundImage, 0, 0, cW, cH);
						} else if (bb) {
							ctx.filter = 'blur(10px)';
							ctx.drawImage(results.image, 0, 0, cW, cH);
						} else if (br) {
							ctx.filter = 'blur(0px)';
							ctx.drawImage(backgroundImage, 0, 0, cW, cH);
						}
						ctx.restore();
						start = performance.now();
					}
				}
			};

			const selfieSegmentation = new SelfieSegmentation({
				locateFile: (file) => {
					cl(file);
					cl(`../models/selfie_segmentation/${file}`);
					return `../models/selfie_segmentation/${file}`;
				}
			});

			selfieSegmentation.setOptions({
				modelSelection: 0
			});

			selfieSegmentation.onResults(onBRResults);

			const controls = window;
			const fpsControl = new controls.FPS();
			new controls.ControlPanel(controlPanel).add([fpsControl]);

			const initMediaPipe = async () => {
				mediaPipeStream();
				ctx = outputCanvas.getContext('2d');
				await camera.start();
				getProcessedStream();

				initConference();
			};

			initMediaPipe();

			const loadUserList = () => {
				for (let u of users) {
					cl(u);
				}
			};

			const getProcessedStream = () => {
				processedStream = outputCanvas.captureStream();
				//   const audiotrack = stream.getAudioTracks()[0];
				//   processedStream.addTrack(audiotrack);
			};

			let createLocal = async () => {
				localStream = new Owt.Base.LocalStream(
					processedStream,
					new Owt.Base.StreamSourceInfo('mic', 'camera')
				);

				localId = localStream.id;

				pc = room.peerConnection;
				cl('room.peerConnection');
				cl(pc);

				videotransceiver = pc.addTransceiver(processedStream.getVideoTracks()[0], {
					direction: 'sendonly',
					streams: [stream]
				});
				audiotransceiver = pc.addTransceiver(processedStream.getAudioTracks()[0], {
					direction: 'sendonly',
					streams: [stream]
				});

				cl('videotransceiver');
				cl(videotransceiver);

				cl('audiotransceiver');
				cl(audiotransceiver);

				let publication = await room.publish(localStream, [videotransceiver, audiotransceiver]);
				localPublication = publication;

				pauseAudio = false;
				toggleAudio();
				pauseVideo = true;
				toggleVideo();

				mixStream(roomId, localPublication.id, 'common');
				cl('publish success');

				publication.addEventListener('error', (err) => {
					cl('Publication error: ' + err.error.message);
				});
			};

			const addRoomEventListener = () => {
				cl('== addRoomEventListener ==');
				room.addEventListener('streamadded', (streamEvent) => {
					cl('Stream added ', streamEvent);

					let stream = streamEvent.stream;
					cl(stream);

					if (localStream && localStream.id === stream.id) {
						return;
					} else {
						cl('localId: ' + localId + ' !== stream.id: ' + stream.id);
						cl('localScreenId: ' + localScreenId + ' !== stream.id: ' + stream.id);
						cl(
							'localname: ' +
								localname +
								' !== getUserFromId(stream.origin).userId: ' +
								getUserFromId(stream.origin).userId
						);

						try {
							if (
								localId !== stream.id &&
								localScreenId !== stream.id &&
								localname !== getUserFromId(stream.origin).userId
							) {
								subscribeStream(stream);
							}
						} catch (ex) {
							cl(ex);
						}
					}

					// mixStream(room, stream.id, "common");
					stream.addEventListener('ended', () => {
						cl(stream.id + ' is ended.');
					});
				});

				room.addEventListener('participantjoined', (event) => {
					if (event.participant.userId !== 'user' && getUserFromId(event.participant.id) === null) {
						users.push({
							id: event.participant.id,
							userId: event.participant.userId,
							role: event.participant.role
						});
						event.participant.addEventListener('left', () => {
							if (event.participant.id !== null && event.participant.userId !== undefined) {
								sendIm(event.participant.userId + ' has left the room ', 'System');
								deleteUser(event.participant.id);
							} else {
								sendIm('Anonymous has left the room.', 'System');
							}
						});
						addUserListItem(event.participant, true);
					}
				});

				room.addEventListener('messagereceived', (event) => {
					var user = getUserFromId(event.origin);
					if (!user) return;
					var receivedMsg = JSON.parse(event.message);
					if (receivedMsg.type == 'msg') {
						if (receivedMsg.data != undefined) {
							var time = new Date();
							var hour = time.getHours();
							hour = hour > 9 ? hour.toString() : '0' + hour.toString();
							var mini = time.getMinutes();
							mini = mini > 9 ? mini.toString() : '0' + mini.toString();
							var sec = time.getSeconds();
							sec = sec > 9 ? sec.toString() : '0' + sec.toString();
							var timeStr = hour + ':' + mini + ':' + sec;
							cl(`${user.userId} ${timeStr} ${receivedMsg.data}`);
						}
					}
				});
			};

			const initConference = () => {
				createToken(roomId, localname, 'presenter', function (response) {
					let token = response;
					if (!room) {
						room = new Owt.Conference.ConferenceClient();
						addRoomEventListener();
					}

					room.join(token).then(
						(resp) => {
							cl('-- join --');
							roomId = resp.id;
							let getLoginUsers = resp.participants;
							let streams = resp.remoteStreams;
							getLoginUsers.map(function (participant) {
								participant.addEventListener('left', () => {
									//TODO:send message for notice everyone the participant has left maybe no need
									deleteUser(participant.id);
								});
								users.push({
									id: participant.id,
									userId: participant.userId,
									role: participant.role
								});
							});

							loadUserList();

							createLocal();

							for (const stream of streams) {
								if (stream.source.audio !== 'mixed' || stream.source.video === 'screen-cast') {
									subscribeStream(stream);
								}
							}

							cl('Streams in conference:', streams.length);
							cl('Participants in conference: ' + resp.participants.length);
							cl('Participants: ');
							cl(resp.participants);
						},
						(err) => {
							cl(err.message);
							error = `No remote camera stream show in page (caused by certificate in test
							  environment)?<br><br>

							  NET::ERR_CERT_AUTHORITY_INVALID

							  <ol>
							    <li>
							      Visit
							      <a href="https://10.239.115.52:8080/socket.io/?EIO=3&transport=polling">the test page</a>
							    </li>
							    <li>
							    "Your connection is not private" -&gt; Click "Advanced" button -&gt; Click "Proceed to 10.239.115.78 (unsafe)"
							    </li>
							    <li>Go back and refresh this page.</li>
							  </ol>`;
						}
					);
				});
			};

			// createOWTStream();
		}
	});
</script>

<div class="gathering">
	<Header nickname={data.nickname} />

	<div class="container">
		<video bind:this={inputVideo}>
			<track kind="captions" />
		</video>

		<div bind:this={gatheringContainer} class={column} id="gatheringContainer">
			<div><canvas bind:this={outputCanvas} /></div>
			<div>2</div>
			<div>3</div>
			<div>4</div>
			<div>5</div>
		</div>

		COMPUTE PRESSURE

		<div bind:this={controlPanel} />

		<Control bind:bb bind:br bind:au={pauseAudio} bind:vi={pauseVideo} />
		<button id="beauty" type="button" on:click={toggleBeauty}>Beauty</button>
		<div>
			<span bind:this={inference}>{inferencedata}</span> ms
		</div>
		<img bind:this={backgroundImage} src="../img/ssbg/01.jpg" alt="background" />
		<img bind:this={backgroundPause} src="../img/ssbg/00.jpg" alt="pause" />
		<div>{@html error}</div>
	</div>
</div>

<style>
	.gathering {
		min-height: calc(100vh - 16px);
		padding: 8px 24px;
		background-color: rgba(32, 33, 36, 1);
		color: rgba(255, 255, 255, 1);
	}

	.container {
		margin: 0 auto;
	}

	.container video {
		display: none;
	}

	#gatheringContainer canvas {
		width: 100%;
		aspect-ratio: 16 / 9;
	}

	video,
	img {
		width: 10%;
		aspect-ratio: 16 / 9;
	}

	#beauty {
		border: 0;
		background: transparent;
		color: rgba(255, 255, 255, 1);
		border: 1px solid rgba(255, 255, 0, 1);
		padding: 0.4rem 2rem;
		cursor: pointer;
	}

	#gatheringContainer {
		display: grid;
		align-items: center;
		justify-items: center;
		grid-gap: 10px;
	}

	.grid1 {
		grid-template-columns: 1fr;
	}

	.grid2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.grid3 {
		grid-template-columns: repeat(3, 1fr);
	}

	.grid4 {
		grid-template-columns: repeat(4, 1fr);
	}

	.grid5 {
		grid-template-columns: repeat(5, 1fr);
	}

	@media (max-width: 575px) {
		.container {
			max-width: 540px;
		}
		.grid1,
		.grid2,
		.grid3,
		.grid4,
		.grid5 {
			grid-template-columns: 1fr;
		}
	}

	@media (min-width: 576px) {
		.container {
			max-width: 540px;
		}

		.grid1,
		.grid2,
		.grid3,
		.grid4,
		.grid5 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 768px) {
		.container {
			max-width: 720px;
		}
		.grid1,
		.grid2,
		.grid3,
		.grid4,
		.grid5 {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 992px) {
		.container {
			max-width: 960px;
		}
		.grid1,
		.grid2,
		.grid3,
		.grid4,
		.grid5 {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (min-width: 1200px) {
		.container {
			max-width: 100%;
		}
		.grid1,
		.grid2,
		.grid3,
		.grid4,
		.grid5 {
			grid-template-columns: repeat(5, 1fr);
		}
	}
</style>
