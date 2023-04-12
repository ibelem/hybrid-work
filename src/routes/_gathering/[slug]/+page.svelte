<script>
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { buildWebGL2Pipeline } from '../../../js/client/webgl2/webgl2Pipeline.js';
	import Header from '../../../lib/Header.svelte';
	import Control from '../../../lib/Control.svelte';
	import Meter from '../../../lib/Meter.svelte';
	// import { Face } from 'kalidokit';
	import { onMount, onDestroy } from 'svelte';
	/** @type {import('./$types').PageData} */
	import {
		initials,
		getTimeMillisec,
		cl,
		videoObject,
		getDateTime,
		fullscreen,
		exitFullscreen,
		getVideoFrame,
		getInputTensor
	} from '../../../js/client/utils.js';
	import { bgList, inputOptions, modelConfigs } from '../../../js/client/resource.js';
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
	export let data;

	let hideError = true;

	let inputVideo, outputCanvas, videos;
	$: br = false;
	$: brui = false;
	$: bb = false;
	$: ul = true;
	$: me = false;
	$: fs = false;
	$: millSec = '';
	let none = 'none';
	let pauseAudio = true,
		pauseVideoMsg = '';
	let pauseVideo = false;
	let audioOnly = false;
	let beauty = false;

	let backgroundImage, bgInput;
	let gatheringVideos, gatheringInfo, controlPanel;
	let gatheringView = 'g gathering';
	let column;

	// SD 720x480, HD 1280x720 , Full HD: 1920x1280,
	// 2K 2048 x 1080, QHD 2560 x 1440, 4K 3840 x 2160 8K 7680 x 4320
	let resolution = { width: 1280, height: 720 };
	let sw = resolution.width;
	let sh = resolution.height;
	let vr = 'HD',
		vrdata = '1280x720';

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
	let backgroundType = 'none';

	let room = null,
		pc,
		videotransceiver,
		audiotransceiver,
		roomId,
		localname = 'user';
	let start,
		end,
		delta,
		inference,
		inferenceData = 0,
		inferenceFpsData = 0;
	let localPublication = null;
	let localId = null;
	let users = [],
		participantId;
	let msg = '',
		msgs = [];
	let muted = false;
	let stream, processedStream, localStream;
	let videoList = [];
	let subList = {};
	let screenSub = null;

	let localScreen, localScreenId, localScreenPubliction;
	let screenSharing = false;
	let remoteScreen = null;
	let remoteScreenName = null;

	// An AbortController used to stop the transform.
	let abortController = null;
	let models = 1,
		isFirstTimeLoad = true,
		modelChanged = false,
		enableWebnnDelegate = false,
		changeBackend,
		changeModel;
	let modelId = 0,
		modelName = '',
		modelConfig = '';
	let switchInference;
	let loadTime = '';
	let outputBuffer;
	let interval;
	let continueInputVideo = true;
	let segmentation, segmentSemantic, renderCamStream;

	const millSecInFullscreen = () => {
		if (fs) {
			interval = setInterval(() => {
				millSec = getTimeMillisec();
			}, 60);
		} else {
			clearInterval(interval);
		}
	};

	const removeFullClass = () => {
		gatheringVideos.childNodes.forEach((c) => {
			if (c.classList) {
				c.classList.remove('full');
			}
		});
	};

	const fS = (e) => {
		let canvasOrVideo = e.target.parentElement.parentElement.parentElement;
		if (canvasOrVideo) {
			canvasOrVideo.classList.add('full');
		}
		fs = fullscreen();
		millSecInFullscreen();
	};

	const switchFs = (e) => {
		let canvasOrVideo = e.target.parentElement;
		if (canvasOrVideo) {
			removeFullClass();
			canvasOrVideo.classList.add('full');
		}
	};

	const videoResolution = () => {
		if (sw === 1280) {
			vr = 'HD';
		}
		if (sw === 720) {
			vr = 'SD';
		}
		vrdata = sw + 'x' + sh;
	};

	const updateBackgroundImage = (e) => {
		backgroundImage.src = e.target.src;
	};

	const onFileSelected = (e) => {
		const files = e.target.files;
		if (files.length > 0) {
			backgroundImage.src = URL.createObjectURL(files[0]);
		}
	};

	const gridSidebar = () => {
		if (!ul && !me && !brui) {
			gatheringView = 'g-noinfo gathering';
		} else {
			gatheringView = 'g gathering';
		}
	};

	const closeParticipants = () => {
		ul = false;
		gridSidebar();
	};

	const closeConversation = () => {
		me = false;
		gridSidebar();
	};

	const closeChangeBackground = () => {
		br = true;
		brui = false;
		gridSidebar();
	};

	// Face.solve(facelandmarkArray, {
	// 	runtime: 'tfjs', // `mediapipe` or `tfjs`
	// 	video: video,
	// 	imageSize: { height: 720, width: 480 },
	// 	smoothBlink: false, // smooth left and right eye blink delays
	// 	blinkSettings: [0.25, 0.75] // adjust upper and lower bound blink sensitivity
	// });

	const updateGrid = () => {
		let t = videoList.length + 1;
		t > 4 ? (column = 'grid5') : (column = 'grid' + t);
	};

	const sendIm = () => {
		let sendMsgInfo = JSON.stringify({
			type: 'msg',
			data: msg
		});

		if (localname !== null) {
			room.send(sendMsgInfo).then(
				() => {
					cl(localname + 'send message successful: ' + msg);
				},
				(err) => {
					cl(localname + 'send failed: ' + err);
				}
			);
		}
	};

	const toggleVideo = () => {
		if (!localPublication || audioOnly) {
			return;
		}

		if (!pauseVideo) {
			//TODO: pause all video?
			//remoteMixedSub.mute(Owt.Base.TrackKind.VIDEO);

			inputVideo.srcObject.getTracks().forEach((track) => {
				if (track.readyState === 'live' && track.kind === 'video') {
					track.enabled = false;
				}
			});

			for (let temp in subList) {
				if (subList[temp] === screenSub) {
					continue;
				}
				subList[temp].mute(Owt.Base.TrackKind.VIDEO);
			}
			localStream.mediaStream.getVideoTracks()[0].enabled = false;

			localPublication.mute(Owt.Base.TrackKind.VIDEO).then(
				() => {
					console.info('mute video');
					pauseVideoMsg = 'Your camera is turned off';
					pauseVideo = !pauseVideo;
				},
				(err) => {
					cl(err);
					console.error('mute video failed');
				}
			);

			// const { error, tVideo } = await asyncUtils(localPublication.mute(Owt.Base.TrackKind.VIDEO));
			// if (!error) {
			//   console.info("mute video");
			//   pauseVideo = !pauseVideo;
			// }
			// console.error("mute video failed: " + error);
		} else {
			inputVideo.srcObject.getTracks().forEach((track) => {
				if (track.readyState === 'live' && track.kind === 'video') {
					track.enabled = true;
				}
			});

			//remoteMixedSub.unmute(Owt.Base.TrackKind.VIDEO);
			for (let temp in subList) {
				if (subList[temp] === screenSub) {
					continue;
				}
				subList[temp].unmute(Owt.Base.TrackKind.VIDEO);
			}
			localStream.mediaStream.getVideoTracks()[0].enabled = true;

			localPublication.unmute(Owt.Base.TrackKind.VIDEO).then(
				() => {
					console.info('unmute video');
					pauseVideoMsg = '';
					pauseVideo = !pauseVideo;
				},
				(err) => {
					cl(err);
					console.error('unmute video failed');
				}
			);

			// const { error, tVideo } = await asyncUtils(localPublication.unmute(Owt.Base.TrackKind.VIDEO));
			// if (!error) {
			//   console.info("unmute video");
			//   pauseVideo = !pauseVideo;
			// }
			// console.error("unmute video failed: " + error);
		}
	};

	const toggleAudio = () => {
		if (!localPublication) {
			return;
		}

		if (!pauseAudio) {
			localPublication.mute(Owt.Base.TrackKind.AUDIO).then(
				() => {
					console.info('mute successfully');
					pauseAudio = !pauseAudio;
				},
				(err) => {
					cl(err);
					console.error('mute failed');
				}
			);
		} else {
			localPublication.unmute(Owt.Base.TrackKind.AUDIO).then(
				() => {
					console.info('unmute successfully');
					pauseAudio = !pauseAudio;
				},
				(err) => {
					cl(err);
					console.error('unmute failed');
				}
			);
		}
	};

	const subscribeStream = (remotestream) => {
		let videoOption = !audioOnly;

		room.subscribe(remotestream, { video: videoOption }).then(
			(subscription) => {
				subList[subscription.id] = subscription;

				if (remotestream.source.video === 'screen-cast') {
					screenSub = subscription;
					remotestream.addEventListener('ended', function (event) {});
				}

				let vl = {
					subscription: subscription,
					remotestreamid: remotestream.id,
					username: getUserFromId(remotestream.origin).userId,
					remotestreamorigin: remotestream.origin
				};

				videoList.push(vl);
				videoList = videoList;
				cl('subscribeStream');
				users = users;
				cl(users);
				updateGrid();
			},
			(err) => {
				cl('subscribe failed:' + err);
			}
		);

		remotestream.addEventListener('ended', () => {
			// $(`#div${remotestream.id}`).remove();
		});

		remotestream.addEventListener('updated', () => {});
	};

	const getUserFromName = (name) => {
		for (let i = 0; i < users.length; ++i) {
			if (users[i] && users[i].userId === name) {
				return users[i];
			}
		}
		return null;
	};

	const getUserFromId = (id) => {
		for (let i = 0; i < users.length; ++i) {
			if (users[i] && users[i].id === id) {
				return users[i];
			}
		}
		return null;
	};

	const deleteUser = (id) => {
		let index = 0;
		for (let i = 0; i < users.length; ++i) {
			if (users[i] && users[i].id === id) {
				index = i;
				break;
			}
		}
		users.splice(index, 1);
		let removeIndex = videoList.map((item) => item.remotestreamorigin).indexOf(id);
		~removeIndex && videoList.splice(removeIndex, 1);
		videoList = videoList;
		updateGrid();
	};

	const getProcessedStream = () => {
		processedStream = outputCanvas.captureStream();
		// const audiotrack = stream.getAudioTracks()[0];
		// processedStream.addTrack(audiotrack);
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
		cl(processedStream);

		// videotransceiver = pc.addTransceiver(processedStream.getVideoTracks()[0], {
		// 	direction: 'sendonly',
		// 	streams: [stream]
		// });
		// audiotransceiver = pc.addTransceiver(processedStream.getAudioTracks()[0], {
		// 	direction: 'sendonly',
		// 	streams: [stream]
		// });

		// cl('videotransceiver');
		// cl(videotransceiver);

		// cl('audiotransceiver');
		// cl(audiotransceiver);

		// let publication = await room.publish(localStream, [videotransceiver, audiotransceiver]);

		let publication = await room.publish(localStream);
		localPublication = publication;

		// pauseAudio = false;
		// toggleAudio();
		// pauseVideo = true;
		// toggleVideo();

		mixStream(roomId, localPublication.id, 'common');
		cl('publish success');

		publication.addEventListener('error', (err) => {
			cl('Publication error: ' + err.error.message);
		});
	};

	const addRoomEventListener = () => {
		cl('== addRoomEventListener ==');
		room.addEventListener('streamadded', (streamEvent) => {
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
				cl(videoList);
				let removeIndex = videoList.map((item) => {
					item.remotestreamid == stream.id;
				});
				~removeIndex && videoList.splice(removeIndex, 1);
				videoList = videoList;
				cl(videoList);
				// remotestreamid == stream.id

				cl(stream.id + ' is ended.');
			});
		});

		room.addEventListener('participantjoined', (event) => {
			if (event.participant.userId !== 'user' && getUserFromId(event.participant.id) === null) {
				users.push({
					id: event.participant.id,
					userId: event.participant.userId,
					role: event.participant.role,
					userInitials: initials(event.participant.userId)
				});

				cl('participantjoined');
				users = users;
				cl(users);
				event.participant.addEventListener('left', () => {
					if (event.participant.id !== null && event.participant.userId !== undefined) {
						sendIm(event.participant.userId + ' has left the room ', 'System');
						deleteUser(event.participant.id);
					} else {
						sendIm('Anonymous has left the room.', 'System');
					}
				});
			}
		});

		room.addEventListener('messagereceived', (event) => {
			let user = getUserFromId(event.origin);
			if (!user) return;
			let receivedMsg = JSON.parse(event.message);
			if (receivedMsg.type == 'msg') {
				if (receivedMsg.data != undefined) {
					let timeStr = getDateTime();
					cl(`${user.userId} ${timeStr} ${receivedMsg.data}`);

					let msg = {
						username: user.userId,
						msgtime: timeStr,
						msg: receivedMsg.data
					};

					msgs.push(msg);
					msgs = msgs;

					// $('#text-content').scrollTop($('#text-content').prop('scrollHeight'));
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
							role: participant.role,
							userInitials: initials(participant.userId)
						});
						participantId = participant.id;
					});

					pauseVideoMsg = 'Your camera is turned off';

					createLocal();

					for (const stream of streams) {
						if (stream.source.audio !== 'mixed' || stream.source.video === 'screen-cast') {
							subscribeStream(stream);
						}
					}

					users = users;
				},
				(err) => {
					cl(err.message);
					hideError = false;
				}
			);
		});
	};

	const shareScreen = () => {
		let width = resolution.width,
			height = resolution.height;

		let screenSharingConfig = {
			audio: {
				source: 'screen-cast'
			},
			video: {
				resolution: {
					width: width,
					height: height
				},
				frameRate: 20,
				source: 'screen-cast'
			}
		};

		Owt.Base.MediaStreamFactory.createMediaStream(screenSharingConfig).then(
			(stream) => {
				localScreen = new Owt.Base.LocalStream(
					stream,
					new Owt.Base.StreamSourceInfo('screen-cast', 'screen-cast')
				);
				console.info(localScreen);
				localScreenId = localScreen.id;
				let screenVideoTracks = localScreen.mediaStream.getVideoTracks();
				for (const screenVideoTrack of screenVideoTracks) {
					screenVideoTrack.addEventListener('ended', function (e) {
						localScreenPubliction.stop();
					});
				}
				room.publish(localScreen).then(
					(publication) => {
						console.info('-- sharescreen: publish success --');
						localScreenPubliction = publication;
					},
					(err) => {
						console.error('localsreen publish failed');
					}
				);
			},
			(err) => {
				console.error('create localscreen failed');
			}
		);
	};

	const stopStream = () => {
		if (localStream) {
			localStream.mediaStream.getTracks().forEach((track) => {
				if (track.readyState === 'live' && track.kind === 'video') {
					track.stop();
				}
			});
		}
		if (localScreen) {
			localScreen.mediaStream.getTracks().forEach((track) => {
				if (track.readyState === 'live' && track.kind === 'video') {
					track.stop();
				}
			});
		}
	};

	// Abort Transform
	const abortTransform = () => {
		abortController.abort();
		abortController = null;
	};

	const exitGathering = () => {
		deleteUser(participantId);
		stopStream();
		(localStream = undefined), (users = []), (subList = {}), (audioOnly = false);
		if (room) room.leave();
		location.href = '../';
	};

	beforeNavigate(() => {
		exitGathering();
	});

	const brUi = () => {
		if (br === true) {
			brui = true;
		} else if (br === false) {
			brui = false;
		}
		gridSidebar();
	};

	const handleMessage = (event) => {
		let msg = event.detail.msg;

		switch (msg) {
			case 'tv':
				toggleVideo();
				break;
			case 'layout':
				brUi();
				switchInference();
				break;
			case 'exit':
				exitGathering();
				break;
			case 'screen-cast':
				shareScreen();
				break;
			case 'exit-fullscreen':
				removeFullClass();
				exitFullscreen();
				fs = false;
				millSecInFullscreen();
				break;
			default:
				break;
		}
	};

	const createOWTStream = async () => {
		stream = await Owt.Base.MediaStreamFactory.createMediaStream(avTrackConstraint);
		if ('srcObject' in inputVideo) {
			inputVideo.srcObject = stream;
		} else {
			inputVideo.src = URL.createObjectURL(stream);
		}

		inputVideo.autoplay = true;
	};

	onDestroy(async () => {
		deleteUser(participantId);
		stopStream();
		(localStream = undefined), (users = []), (subList = {}), (audioOnly = false);
		if (room) room.leave();
	});

	onMount(async () => {
		if (browser) {
			updateGrid();
			localname = decodeURI(
				new URL(window.location).pathname.toLocaleLowerCase().replace('/_gathering/', '')
			);

			const worker = new Worker('../js/tfjs/builtin_delegate_worker.js');

			async function postAndListenMessage(postedMessage) {
				if (postedMessage.action == 'compute') {
					// Transfer buffer rather than copy
					worker.postMessage(postedMessage, [postedMessage.buffer.buffer]);
				} else {
					worker.postMessage(postedMessage);
				}

				const result = await new Promise((resolve) => {
					worker.onmessage = (event) => {
						resolve(event.data);
					};
				});
				return result;
			}

			const postProcessingConfig = {
				smoothSegmentationMask: true,
				jointBilateralFilter: { sigmaSpace: 1, sigmaColor: 0.1 },
				coverage: [0.5, 0.75],
				lightWrapping: 0.3,
				blendMode: 'screen'
			};

			outputCanvas.width = resolution.width;
			outputCanvas.height = resolution.height;

			const drawOutput = async (outputBuffer, srcElement) => {
				if (modelName.toLowerCase().startsWith('deeplab') && outputBuffer) {
					// Do additional `argMax` for DeepLabV3 model
					outputBuffer = tf.tidy(() => {
						const a = tf.tensor(outputBuffer, [1, 257, 257, 21], 'float32');
						const b = tf.argMax(a, 3);
						const c = tf.tensor(b.dataSync(), b.shape, 'float32');
						return c.dataSync();
					});
				}

				const pipeline = buildWebGL2Pipeline(
					srcElement,
					backgroundImage,
					backgroundType,
					inputOptions.inputResolution,
					outputCanvas,
					outputBuffer
				);

				pipeline.updatePostProcessingConfig(postProcessingConfig);
				await pipeline.render();
			};

			const pipeline2 = buildWebGL2Pipeline(
				inputVideo,
				backgroundImage,
				'none',
				[321, 321],
				outputCanvas,
				null
			);

			pipeline2.updatePostProcessingConfig(postProcessingConfig);

			const videoCanvasOnFrame = async () => {
				videoResolution();
				if (continueInputVideo) {
					requestAnimationFrame(videoCanvasOnFrame);
					// ctx2d.drawImage(inputvideo, 0, 0, cW, cH);
					if (stream) {
						await pipeline2.render();
					}
				}
			};

			segmentSemantic = () => {
				return async (videoFrame, controller) => {
					if (bb || br) {
						const inputBuffer = getInputTensor(videoFrame, inputOptions);
						const start = performance.now();
						const result = await postAndListenMessage({ action: 'compute', buffer: inputBuffer });
						if (result !== 'null') {
							inferenceData = (performance.now() - start).toFixed(2);
							outputBuffer = result.outputBuffer;
							await drawOutput(outputBuffer, videoFrame);
							inferenceFpsData = (1000 / inferenceData).toFixed(0);
						}
						cl('computing: ++++++++++');
					}
					const frame_from_canvas = new VideoFrame(outputCanvas, { timestamp: 0 });
					videoFrame.close();
					controller.enqueue(frame_from_canvas);
				};
			};

			renderCamStream = async () => {
				const videoTrack = stream.getVideoTracks()[0];
				const processor = new MediaStreamTrackProcessor({ track: videoTrack });
				const generator = new MediaStreamTrackGenerator({ kind: 'video' });

				const source = processor.readable;
				const sink = generator.writable;

				const transformer = new TransformStream({ transform: segmentSemantic() });

				abortController = new AbortController();
				const signal = abortController.signal;

				const popeThroughPromise = source.pipeThrough(transformer, { signal }).pipeTo(sink);

				popeThroughPromise.catch((e) => {
					if (signal.aborted) {
						console.log('Shutting down streams after abort.');
					} else {
						console.error('Error from stream transform:', e);
					}
					source.cancel(e);
					sink.abort(e);
				});

				processedStream.addTrack(generator);
			};

			segmentation = async () => {
				videoResolution();
				if (modelName != '') abortTransform();
				modelName = modelConfigs[modelId].name;
				modelConfig = modelConfigs[modelId].inputDimensions.toString().replaceAll(',', 'x');
				if (isFirstTimeLoad || modelChanged) {
					isFirstTimeLoad = false;
					modelChanged = false;
					const options = {
						action: 'load',
						modelPath: modelConfigs[modelId].modelPath,
						enableWebNNDelegate: enableWebnnDelegate,
						webNNDevicePreference: 0
					};
					let lt = await postAndListenMessage(options);
					if (typeof lt === 'string') {
						loadTime = `in ${lt} ms`;
					} else {
						loadTime = '';
					}
				}

				inputOptions.inputDimensions = modelConfigs[modelId].inputDimensions;
				inputOptions.inputResolution = modelConfigs[modelId].inputResolution;
				continueInputVideo = false;
				await renderCamStream();
			};

			changeBackend = async () => {
				enableWebnnDelegate = !enableWebnnDelegate;
				modelChanged = true;
				await segmentation();
			};

			changeModel = async (event) => {
				models = event.currentTarget.value;
				modelId = models - 1;
				modelChanged = true;
				await segmentation();
			};

			switchInference = async () => {
				if (!bb && !br) {
					backgroundType = 'none';
					continueInputVideo = true;
					await videoCanvasOnFrame();
					cl('///++++');
					cl(`br: ${br}, bblur: ${bb}`);
				} else {
					if (br && bb) {
						cl('///000');
						cl(`br: ${br}, bblur: ${bb}`);
						backgroundType = 'image';
					} else if (bb) {
						cl('///111');
						cl(`br: ${br}, bblur: ${bb}`);
						backgroundType = 'blur';
					} else if (br) {
						cl('///222');
						cl(`br: ${br}, bblur: ${bb}`);
						backgroundType = 'image';
					} else {
						cl('///===');
						cl(`br: ${br}, bblur: ${bb}`);
					}

					continueInputVideo = false;
					await segmentation();
				}
			};

			const verifyMediaStreamTrack = () => {
				// Global MediaStreamTrackProcessor, MediaStreamTrackGenerator, VideoFrame.
				if (
					typeof MediaStreamTrackProcessor === 'undefined' ||
					typeof MediaStreamTrackGenerator === 'undefined'
				) {
					console.error(
						'Your browser does not support the MediaStreamTrack API for Insertable Streams of Media.'
					);
				}
				try {
					new MediaStreamTrackGenerator('video');
					console.log('Video insertable streams supported.');
				} catch (e) {
					console.error('Your browser does not support insertable video streams.');
				}
				if (typeof VideoFrame === 'undefined') {
					console.error('Your browser does not support WebCodecs.');
				}
			};

			const init = async () => {
				verifyMediaStreamTrack();
				await createOWTStream();
				getProcessedStream();
				initConference();
				backgroundType = 'none';
				await videoCanvasOnFrame();
				await tf.setBackend('wasm');
				await tf.ready();
			};

			init();
		}
	});
</script>

<div class="{gatheringView} fs-{fs}">
	<Header nickname={data.nickname} />

	<div class="videos">
		<video id="owner" bind:this={inputVideo}>
			<track kind="captions" />
		</video>

		<div id="gatheringContainer">
			<div bind:this={gatheringVideos} class={column} id="gatheringVideos">
				<div class="v">
					{#if pauseVideo}
						<div class="muteShow">
							<svg class="mutevideo" viewBox="0 0 640 512">
								<path
									d="M633.8 458.1l-55-42.5c15.4-1.4 29.2-13.7 29.2-31.1v-257c0-25.5-29.1-40.4-50.4-25.8L448 177.3v137.2l-32-24.7v-178c0-26.4-21.4-47.8-47.8-47.8H123.9L45.5 3.4C38.5-2 28.5-.8 23 6.2L3.4 31.4c-5.4 7-4.2 17 2.8 22.4L42.7 82 416 370.6l178.5 138c7 5.4 17 4.2 22.5-2.8l19.6-25.3c5.5-6.9 4.2-17-2.8-22.4zM32 400.2c0 26.4 21.4 47.8 47.8 47.8h288.4c11.2 0 21.4-4 29.6-10.5L32 154.7v245.5z"
								/>
							</svg>
							<div class="pausevideomsg">{pauseVideoMsg}</div>
						</div>
					{/if}
					<canvas class={pauseVideo} bind:this={outputCanvas} on:click={switchFs} />
					<div class="bar">
						<div class="username">
							{localname}
						</div>
						<button class="enterFullscreen" type="button" on:click={fS}>
							<svg height="48" viewBox="0 96 960 960" width="48"
								><path
									d="M200 856V663h60v133h133v60H200Zm0-367V296h193v60H260v133h-60Zm367 367v-60h133V663h60v193H567Zm133-367V356H567v-60h193v193h-60Z"
								/></svg
							></button
						>
					</div>
				</div>

				{#each videoList as vl}
					<div id="div{vl.remotestreamid}" class="v {vl.remotestreamorigin}">
						<video
							bind:this={videos}
							autoplay
							id="v{vl.remotestreamid}"
							use:videoObject={vl.subscription.stream}
							on:click={switchFs}
						>
							<track kind="captions" />
						</video>
						<div class="bar">
							<div class="username">
								{vl.username}
							</div>
							<button class="enterFullscreen" type="button" on:click={fS}>
								<svg height="48" viewBox="0 96 960 960" width="48"
									><path
										d="M200 856V663h60v133h133v60H200Zm0-367V296h193v60H260v133h-60Zm367 367v-60h133V663h60v193H567Zm133-367V356H567v-60h193v193h-60Z"
									/></svg
								></button
							>
						</div>
					</div>
				{/each}
			</div>
			<div id="gatheringInfo" class={gatheringInfo}>
				<div id="participants" class={ul}>
					<div class="rb">
						<div class="title">Participants <span id="usercount">({users.length})</span></div>
						<button type="button" class="close" on:click={closeParticipants}>
							<svg viewBox="0 0 352 512">
								<path
									d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
								/>
							</svg>
						</button>
					</div>
					<div id="userList">
						<ul>
							{#each users as user}
								<li id={user.id}>
									<!-- <svg viewBox="0 0 24 24">
										<path
											fill="currentColor"
											d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6M12,13C14.67,13 20,14.33 20,17V20H4V17C4,14.33 9.33,13 12,13M12,14.9C9.03,14.9 5.9,16.36 5.9,17V18.1H18.1V17C18.1,16.36 14.97,14.9 12,14.9Z"
										/>
									</svg> -->
									<div class="initials">{user.userInitials}</div>
									<div class="name">{user.userId}</div>
									{#if muted}
										<svg viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"
											/>
										</svg>
									{:else}
										<svg viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"
											/>
										</svg>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<div id="conversation" class={me}>
					<div class="rb">
						<div class="title">Conversation</div>
						<button type="button" class="close" on:click={closeConversation}>
							<svg viewBox="0 0 352 512">
								<path
									d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
								/>
							</svg>
						</button>
					</div>
					<div id="msgContainer">
						{#each msgs as msg}
							<div class="msgLists">
								<div class="msgItem">
									<div class="name">{msg.username}</div>
									<div class="time">{msg.msgtime}</div>
								</div>
								<div>{msg.msg}</div>
							</div>
						{/each}
					</div>
					<div id="message">
						<textarea id="msg" bind:value={msg} placeholder="" />
						<button type="button" id="send" on:click={sendIm}>
							<svg viewBox="0 0 512 512">
								<path
									d="M440 6.5L24 246.4c-34.4 19.9-31.1 70.8 5.7 85.9L144 379.6V464c0 46.4 59.2 65.5 86.6 28.6l43.8-59.1 111.9 46.2c5.9 2.4 12.1 3.6 18.3 3.6 8.2 0 16.3-2.1 23.6-6.2 12.8-7.2 21.6-20 23.9-34.5l59.4-387.2c6.1-40.1-36.9-68.8-71.5-48.9zM192 464v-64.6l36.6 15.1L192 464zm212.6-28.7l-153.8-63.5L391 169.5c10.7-15.5-9.5-33.5-23.7-21.2L155.8 332.6 48 288 464 48l-59.4 387.3z"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div id="changebackground" class={brui}>
					<div class="rb">
						<div class="title">Change background</div>
						<button type="button" class="close" on:click={closeChangeBackground}>
							<svg viewBox="0 0 352 512">
								<path
									d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
								/>
							</svg>
						</button>
					</div>
					<div id="bgs">
						{#each bgList as bg}
							<div class="bgselector">
								<button type="button" on:click={updateBackgroundImage}>
									<img src="../img/ssbg/{bg}" alt="" />
								</button>
							</div>
						{/each}
					</div>
					<img
						bind:this={backgroundImage}
						src="../img/ssbg/01.jpg"
						style="display:none"
						alt="background"
					/>

					<div id="bgimage">
						<input
							id="bgimg"
							on:change={(e) => onFileSelected(e)}
							bind:this={bgInput}
							type="file"
							name="f"
							accept="image/*"
							class="inputfile inputf"
						/>
						<label for="bgimg">
							<svg width="20" height="17" viewBox="0 0 20 17">
								<path
									d="M10 0l-5.2 4.9h3.3v5.1h3.8v-5.1h3.3l-5.2-4.9zm9.3 11.5l-3.2-2.1h-2l3.4 2.6h-3.5c-.1 0-.2.1-.2.1l-.8 2.3h-6l-.8-2.2c-.1-.1-.1-.2-.2-.2h-3.6l3.4-2.6h-2l-3.2 2.1c-.4.3-.7 1-.6 1.5l.6 3.1c.1.5.7.9 1.2.9h16.3c.6 0 1.1-.4 1.3-.9l.6-3.1c.1-.5-.2-1.2-.7-1.5z"
								/>
							</svg>
						</label>
					</div>
				</div>
			</div>
		</div>
		<!-- <div>{@html error}</div> -->

		<div class="certmsg {hideError}">
			No remote camera stream show in page (caused by certificate in test environment)?<br /><br />

			NET::ERR_CERT_AUTHORITY_INVALID

			<ol>
				<li>
					Visit https://&lt;url value in config.json, port is :8080 instead of
					:3000&gt;/socket.io/?EIO=3&transport=polling
				</li>
				<li>
					"Your connection is not private" -&gt; Click "Advanced" button -&gt; Click "Proceed to
					xxx.xxx.xxx.xxx (unsafe)"
				</li>
				<li>Go back and refresh this page.</li>
			</ol>
		</div>
	</div>
	<footer>
		<div class="indicatorContainer">
			<div class="indicator">
				<Meter />
				<div class="inference ichild">
					<div class="time first">
						<div class="if">{vrdata}</div>
						<div class="unit">
							{vr}
						</div>
					</div>
					<div class="title">Video Resolution</div>
				</div>
				{#if bb || br}
					<div class="inference ichild {none}">
						<div class="time first">
							<div bind:this={inference} id="inferencetime" class="if">
								{inferenceData}
							</div>
							<div class="unit">ms</div>
						</div>
						<div class="title">Inference Time</div>
					</div>
					<div class="inference ichild {none}">
						<div class="fps first">
							<div class="if">{inferenceFpsData}</div>
							<div class="unit">fps</div>
						</div>
						<div class="title">Inference FPS</div>
					</div>
				{/if}
			</div>
			<div class="subinfo">
				<div>
					<span class="divider" />
					<span class="content milsec">
						{#if fs}
							{millSec}{/if}
					</span>
				</div>
				{#if bb || br}
					<div>
						<span class="divider" />
						<span class="content dnone">{modelName}</span>
					</div>
					<div>
						<span class="content">Loaded {loadTime}</span>
					</div>
					<div>
						<span class="divider" />
						<span class="content">{modelConfig}</span>
					</div>

					<div class="model m_{models}">
						<label>
							<input
								checked={models === 1}
								on:change={changeModel}
								type="radio"
								name="amount"
								value="1"
							/> Selfie Segmentation
						</label>
						<label>
							<input
								checked={models === 2}
								on:change={changeModel}
								type="radio"
								name="amount"
								value="2"
							/> Selfie Segmentation Landscape
						</label>
						<label>
							<input
								checked={models === 3}
								on:change={changeModel}
								type="radio"
								name="amount"
								value="3"
							/> DeepLab
						</label>
					</div>
					<div>
						<input
							class="tgl tgl-flip"
							id="backend"
							on:click={changeBackend}
							bind:checked={enableWebnnDelegate}
							type="checkbox"
						/>
						<label class="tgl-btn" data-tg-off="Wasm" data-tg-on="WebNN" for="backend" />
					</div>
				{/if}
			</div>
		</div>

		<div bind:this={controlPanel} style="display: none" />
		<Control bind:ul bind:me bind:bb bind:br bind:none on:message={handleMessage} />
	</footer>
</div>

<style>
</style>
