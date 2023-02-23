<script>
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import Header from '../../../lib/Header.svelte';
	import Control from '../../../lib/Control.svelte';
	import Meter from '../../../lib/Meter.svelte';
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
	let none = 'none';
	let pauseAudio = true,
		pauseVideoMsg = '';
	let pauseVideo = true;
	let audioOnly = false;
	let beauty = false;

	let backgroundImage;
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
					pauseVideoMsg = 'Your camera is truned off';
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

	function addVideo(subscription, remotestream, username) {
		let usernametag = '';
		if (username) {
			usernametag = `<div class="username">${username}</div><div class="usernamefs">${username}</div>`;
		}
		let divcode = `
    <div class="vslot" id=${'div' + remotestream.id}>
      <video autoplay id=${
				'v' + remotestream.id
			} style="display:block" onclick="switchfullscreen(this)">this browser does not supported video tag
      </video>
      <div class="bar">
        <button type="button" class="btnfullscreen" onclick="remotefullscreen(this)">
          <svg viewBox="0 0 448 512">
            <path
              fill="currentColor"
              d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z"
            ></path>
          </svg>
        </button>
      </div>
      ${usernametag}
    </div>
    `;
		let div = document.createElement('div');
		div.innerHTML = divcode;
		document.querySelector('#gatheringContainer').appendChild(div);
		let t = document.querySelector('#v' + remotestream.id);
		t.srcObject = subscription.stream;
		console.log(t);
		console.log(username);
		console.log(username);
		console.log(username);
	}

	const subscribeStream = (remotestream) => {
		let videoOption = !audioOnly;

		room.subscribe(remotestream, { video: videoOption }).then(
			(subscription) => {
				subList[subscription.id] = subscription;

				if (remotestream.source.video === 'screen-cast') {
					screenSub = subscription;
					remotestream.addEventListener('ended', function (event) {});
				}

				addVideo(subscription, remotestream, getUserFromId(remotestream.origin).userId);
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

	function addUserListItem(user, muted) {
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
	}

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
		// $('li').remove(":contains(" + id + ")");
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

					cl('222');

					pauseVideoMsg = 'Your camera is truned off';

					loadUserList();

					cl('333');

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

	onMount(async () => {
		if (browser) {
			let gatheringContainerChildCount = gatheringContainer.childElementCount;
			gatheringContainerChildCount > 4
				? (column = 'grid5')
				: (column = 'grid' + gatheringContainer.childElementCount);

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

<div class="gathering">
	<Header nickname={data.nickname} />

	<div class="container">
		<video bind:this={inputVideo}>
			<track kind="captions" />
		</video>

		<div bind:this={gatheringContainer} class={column} id="gatheringContainer">
			<div class="v">
				{#if pauseVideo}
					<svg class="mutevideo" viewBox="0 0 640 512">
						<path
							d="M633.8 458.1l-55-42.5c15.4-1.4 29.2-13.7 29.2-31.1v-257c0-25.5-29.1-40.4-50.4-25.8L448 177.3v137.2l-32-24.7v-178c0-26.4-21.4-47.8-47.8-47.8H123.9L45.5 3.4C38.5-2 28.5-.8 23 6.2L3.4 31.4c-5.4 7-4.2 17 2.8 22.4L42.7 82 416 370.6l178.5 138c7 5.4 17 4.2 22.5-2.8l19.6-25.3c5.5-6.9 4.2-17-2.8-22.4zM32 400.2c0 26.4 21.4 47.8 47.8 47.8h288.4c11.2 0 21.4-4 29.6-10.5L32 154.7v245.5z"
						/>
					</svg>
					<div class="pausevideomsg">{pauseVideoMsg}</div>
				{/if}
				<canvas class={pauseVideo} bind:this={outputCanvas} />
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
	footer {
		position: fixed;
		bottom: 24px;
		width: 100%;
	}

	.indicator {
		text-transform: lowercase;
		display: flex;
		font-family: 'Exo 2';
		justify-content: left;
	}

	.indicator .title {
		text-transform: uppercase;
	}

	.indicator .none {
		display: none;
	}

	.indicator .ichild:hover {
		cursor: pointer;
	}

	.indicator .ichild {
		width: 136px;
		margin-right: 4px;
	}

	.indicator .ichild:last-child {
		margin-right: 0;
	}

	.indicator .ichild .first {
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 24px;
		padding: 6px 0 8px 0;
		align-items: center;
		justify-content: center;
		background: rgba(32, 33, 36, 1);
		color: rgba(255, 255, 255, 0.9);
		letter-spacing: 0px;
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: flex-end;
	}

	.indicator:hover .ichild .first {
		flex-direction: column;
		align-items: center;
	}

	.unit {
		letter-spacing: 0;
		text-transform: lowercase;
	}

	.indicator .ichild .first .unit {
		margin-left: 4px;
		font-size: 12px;
	}

	.indicator:hover .ichild .first .unit {
		margin-left: 0;
	}

	.indicator:hover .ichild .first #inferencetime,
	.indicator:hover .ichild .first .fpsdata {
		font-size: 40px;
	}

	.indicator:hover .ichild .first {
		color: rgba(0, 255, 255, 1);
		border: 1px solid rgba(0, 255, 255, 0.2);
	}

	.indicator .ichild:hover .first ::after {
		content: '';
		position: absolute;
		left: 0px;
		top: 0px;
		background: linear-gradient(115deg, #4fcf70, #fad648, #a767e5, #12bcfe, #44ce7b);
		background-size: 100%;
		width: calc(100% + 0px);
		height: calc(100% + 2px);
		z-index: -1;
	}

	.indicator .ichild .title {
		border: 0;
		font-size: 10px !important;
		padding: 6px;
	}

	.indicator .ichild:hover .title {
		color: rgba(0, 255, 255, 1);
	}

	.gathering {
		min-height: calc(100vh - 16px);
		padding: 8px 24px;
		background-color: rgba(32, 33, 36, 1);
		color: rgba(255, 255, 255, 0.9);
	}

	.gathering:hover {
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
		height: 100%;
		aspect-ratio: 16 / 9;
	}

	video,
	img {
		width: 10%;
		aspect-ratio: 16 / 9;
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
	svg.mutevideo {
		fill: rgba(255, 255, 255, 0.6);
		width: 20%;
		height: 20%;
	}
	.pausevideomsg {
		color: rgba(255, 255, 255, 0.6);
	}
	.v:hover svg.mutevideo {
		fill: rgba(255, 255, 255, 1);
	}
	.v:hover .pausevideomsg {
		color: rgba(255, 255, 255, 1);
	}
	.v {
		width: 100%;
	}
	canvas.false {
		display: block;
	}
	canvas.true {
		display: none;
	}
</style>
