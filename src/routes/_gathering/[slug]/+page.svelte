<script>
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import Header from '../../../lib/Header.svelte';
	import Control from '../../../lib/Control.svelte';
	import Meter from '../../../lib/Meter.svelte';
	// import { Face } from 'kalidokit';
	import { onMount, onDestroy } from 'svelte';
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
	let none = 'none';
	let pauseAudio = true,
		pauseVideoMsg = '';
	let pauseVideo = false;
	let audioOnly = false;
	let beauty = false;

	let backgroundImage;
	let gatheringContainer, gatheringVideos, gatheringInfo, controlPanel;
	let gatheringVideosChildCount = 4;
	let gatheringView = 'g gathering';
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
		localname = 'user';
	let start,
		end,
		delta,
		inference,
		inferenceData = 0,
		inferenceFpsData = 0;
	let localPublication = null;
	let localId = null;
	let users = [];
	let stream, processedStream, localStream;
	let subList = {};
	let screenSub = null;

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

	const updateGrid = () => {
		gatheringVideosChildCount = gatheringVideos.childElementCount;
		gatheringVideosChildCount > 4
			? (column = 'grid5')
			: (column = 'grid' + gatheringVideos.childElementCount);
	};

	const sendIm = (msg, sender) => {
		let time = new Date();
		let hour = time.getHours();
		hour = hour > 9 ? hour.toString() : '0' + hour.toString();
		let mini = time.getMinutes();
		mini = mini > 9 ? mini.toString() : '0' + mini.toString();
		let sec = time.getSeconds();
		sec = sec > 9 ? sec.toString() : '0' + sec.toString();
		let timeStr = hour + ':' + mini + ':' + sec;
		cl(msg);
		// if (msg === undefined) {
		// 	// send local msg
		// 	if ($('#text-send').val()) {
		// 		msg = $('#text-send').val();
		// 		let sendMsgInfo = JSON.stringify({
		// 			type: 'msg',
		// 			data: msg
		// 		});
		// 		$('#text-send').val('').height('18px');
		// 		$('#text-content').css('bottom', '30px');
		// 		sender = localId;
		// 		console.info('ready to send message');
		// 		// send to server
		// 		if (localname !== null) {
		// 			room.send(sendMsgInfo).then(
		// 				() => {
		// 					console.info('begin to send message');
		// 					console.info(localname + 'send message: ' + msg);
		// 				},
		// 				(err) => {
		// 					console.error(localname + 'sned failed: ' + err);
		// 				}
		// 			);
		// 		}
		// 	} else {
		// 		return;
		// 	}
		// }

		// let user = getUserFromId(sender);
		// let name = user ? user['userId'] : 'System';
		// if (name !== 'System') {
		// 	$('<p>')
		// 		.html(
		// 			`
		//   <div class="msghead">
		//   <div class="msguser">${user.userId}</div><div class="msgtime">${timeStr}</div>
		//   </div>
		//   `
		// 		)
		// 		.append(document.createTextNode(msg))
		// 		.appendTo('#text-content');
		// 	// scroll to bottom of text content
		// 	$('#text-content').scrollTop($('#text-content').prop('scrollHeight'));
		// }
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

	const addVideo = (subscription, remotestream, username, origin) => {
		// onclick="switchfullscreen(this)"
		let divcode = `
      <video autoplay id=${'v' + remotestream.id}>
      </video>
			<div class="username">${username}</div>
    `;
		let div = document.createElement('div');
		div.setAttribute('id', 'div' + remotestream.id);
		div.setAttribute('class', 'v ' + origin);
		div.innerHTML = divcode;
		document.querySelector('#gatheringVideos').appendChild(div);
		document.querySelector('#v' + remotestream.id).srcObject = subscription.stream;
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

				addVideo(
					subscription,
					remotestream,
					getUserFromId(remotestream.origin).userId,
					remotestream.origin
				);

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

	const addUserListItem = (user, muted) => {
		let muteBtn = `<div class="muteShow" isMuted="true">
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z" />
      </svg> 
    </div>`;
		let unmuteBtn = `<div class="muteShow" isMuted="true">
      <svg viewBox="0 0 24 24">
        <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" />
      </svg>
    </div>`;
		let muteStatus = muted ? muteBtn : unmuteBtn;
		// $('#user-list').append(
		// 	'<li><div class="userID">' +
		// 		user.id +
		// 		`</div>
		// <svg viewBox="0 0 24 24">
		// <path fill="currentColor" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,6A2,2 0 0,0 10,8A2,2 0 0,0 12,10A2,2 0 0,0 14,8A2,2 0 0,0 12,6M12,13C14.67,13 20,14.33 20,17V20H4V17C4,14.33 9.33,13 12,13M12,14.9C9.03,14.9 5.9,16.36 5.9,17V18.1H18.1V17C18.1,16.36 14.97,14.9 12,14.9Z" />
		// </svg>
		// <div class="name">` +
		// 		user.userId +
		// 		'</div>' +
		// 		muteStatus +
		// 		'</li>'
		// );
		cl(user.userId + ' *** ' + muteStatus);
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
		let userdiv = document.querySelector('.' + id);
		if (userdiv) {
			document.querySelector('#gatheringVideos').removeChild(userdiv);
			cl('removed .' + id);
		} else {
			cl('remove failed');
		}

		updateGrid();
	};

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
		cl(processedStream);

		cl('4444');

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
			let user = getUserFromId(event.origin);
			if (!user) return;
			let receivedMsg = JSON.parse(event.message);
			if (receivedMsg.type == 'msg') {
				if (receivedMsg.data != undefined) {
					let time = new Date();
					let hour = time.getHours();
					hour = hour > 9 ? hour.toString() : '0' + hour.toString();
					let mini = time.getMinutes();
					mini = mini > 9 ? mini.toString() : '0' + mini.toString();
					let sec = time.getSeconds();
					sec = sec > 9 ? sec.toString() : '0' + sec.toString();
					let timeStr = hour + ':' + mini + ':' + sec;
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
						cl('111');
						users.push({
							id: participant.id,
							userId: participant.userId,
							role: participant.role
						});
					});

					pauseVideoMsg = 'Your camera is turned off';

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
					error = `
						<div class="certmsg">
							No remote camera stream show in page (caused by certificate in test
							environment)?<br><br>

							NET::ERR_CERT_AUTHORITY_INVALID

							<ol>
								<li>
									Visit
									<a href="https://10.239.115.52:8080/socket.io/?EIO=3&transport=polling">the test page</a>
								</li>
								<li>
								"Your connection is not private" -&gt; Click "Advanced" button -&gt; Click "Proceed to xxx.xxx.xxx.xxx (unsafe)"
								</li>
								<li>Go back and refresh this page.</li>
							</ol>
						</div>`;
				}
			);
		});
	};

	// createOWTStream();

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

	const exitGathering = () => {
		stopStream();
		(localStream = undefined), (users = []), (subList = {}), (audioOnly = false);
		if (room) room.leave();
		location.href = '../';
	};

	beforeNavigate(() => {
		exitGathering();
	});

	const handleMessage = (event) => {
		if (event.detail.msg === 'tv') {
			toggleVideo();
		}
	};

	onDestroy(async () => {
		stopStream();
		(localStream = undefined), (users = []), (subList = {}), (audioOnly = false);
		if (room) room.leave();
	});

	onMount(async () => {
		if (browser) {
			updateGrid();

			localname = new URL(window.location).pathname.toLocaleLowerCase().replace('/_gathering/', '');

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
				// if (pauseVideo) {
				// 	ctx.drawImage(backgroundPause, 0, 0, cW, cH);
				// } else {
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
						inferenceData = delta.toFixed(1);
						inferenceFpsData = (1000.0 / delta.toFixed(1)).toFixed(0);
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
				// }
			};

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
		}
	});
</script>

<div class={gatheringView}>
	<Header nickname={data.nickname} />

	<div class="videos">
		<video id="owner" bind:this={inputVideo}>
			<track kind="captions" />
		</video>

		<div id="gatheringContainer">
			<div bind:this={gatheringVideos} class={column} id="gatheringVideos">
				<div class="v">
					{#if pauseVideo}
						<div class="mutediv">
							<svg class="mutevideo" viewBox="0 0 640 512">
								<path
									d="M633.8 458.1l-55-42.5c15.4-1.4 29.2-13.7 29.2-31.1v-257c0-25.5-29.1-40.4-50.4-25.8L448 177.3v137.2l-32-24.7v-178c0-26.4-21.4-47.8-47.8-47.8H123.9L45.5 3.4C38.5-2 28.5-.8 23 6.2L3.4 31.4c-5.4 7-4.2 17 2.8 22.4L42.7 82 416 370.6l178.5 138c7 5.4 17 4.2 22.5-2.8l19.6-25.3c5.5-6.9 4.2-17-2.8-22.4zM32 400.2c0 26.4 21.4 47.8 47.8 47.8h288.4c11.2 0 21.4-4 29.6-10.5L32 154.7v245.5z"
								/>
							</svg>
							<div class="pausevideomsg">{pauseVideoMsg}</div>
						</div>
					{/if}
					<canvas class={pauseVideo} bind:this={outputCanvas} />
					<div class="username">{localname}</div>
				</div>
			</div>
			<div id="gatheringInfo">
				<div id="participants">
					<div class="title">Participants <span id="pnumber" /></div>
					<!-- <div id="presenters">Presenters (0)</div> -->
					<div id="user-list" class="bg" />
				</div>

				<div id="conversation" class="lb">
					<div class="title">Conversation</div>
					<div id="text-content" class="bg" />
					<div id="message">
						<textarea id="text-send" placeholder="..." />
						<button type="button" id="send-btn" onclick="sendIm()">
							<svg class="svg-inline--fa fa-paper-plane fa-w-16" viewBox="0 0 512 512">
								<path
									fill="currentColor"
									d="M440 6.5L24 246.4c-34.4 19.9-31.1 70.8 5.7 85.9L144 379.6V464c0 46.4 59.2 65.5 86.6 28.6l43.8-59.1 111.9 46.2c5.9 2.4 12.1 3.6 18.3 3.6 8.2 0 16.3-2.1 23.6-6.2 12.8-7.2 21.6-20 23.9-34.5l59.4-387.2c6.1-40.1-36.9-68.8-71.5-48.9zM192 464v-64.6l36.6 15.1L192 464zm212.6-28.7l-153.8-63.5L391 169.5c10.7-15.5-9.5-33.5-23.7-21.2L155.8 332.6 48 288 464 48l-59.4 387.3z"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- <button id="beauty" type="button" on:click={toggleBeauty}>Beauty</button> -->

		<img
			bind:this={backgroundImage}
			src="../img/ssbg/01.jpg"
			alt="background"
			style="display:none"
		/>

		<div>{@html error}</div>

		<footer>
			<div class="indicator">
				<Meter />
				<div class="inference ichild {none}">
					<div class="time first">
						<div bind:this={inference} id="inferencetime">{inferenceData}</div>
						<div class="unit">ms</div>
					</div>
					<div class="title">Inference Time</div>
				</div>
				<div class="inferencefps ichild {none}">
					<div class="fps first">
						<div id="fps" class="fpsdata">0</div>
						<div class="unit">fps</div>
					</div>
					<div class="title">Inference FPS</div>
				</div>
				<div class="inferencefps ichild {none}">
					<div class="fps first">
						<div class="fpsdata">{inferenceFpsData}</div>
						<div class="unit">fps</div>
					</div>
					<div class="title">Inference FPS</div>
				</div>
			</div>

			<div bind:this={controlPanel} style="display: none" />
			<Control bind:bb bind:br bind:none on:click={exitGathering} on:message={handleMessage} />
		</footer>
	</div>
</div>

<style>
</style>
