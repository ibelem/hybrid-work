const initials = (name) => {
	if (name) {
		if (name.replace(/[^a-zA-Z- ]/g, '').match(/\b\w/g)) {
			return name
				.replace(/[^a-zA-Z- ]/g, '')
				.match(/\b\w/g)
				.toString()
				.replace(',', '')
				.slice(0, 2);
		} else {
			return name.toString().replace(',', '').slice(0, 1);
		}
	} else {
		return 'unk';
	}
};

const cl = (msg) => {
	console.log(msg);
};

const videoObject = (node, stream) => {
	node.srcObject = stream;
	return {
		update(nextStream) {
			node.srcObject = stream;
		},
		destroy() {
			/* stream revoking logic here */
		}
	};
};

const padNumber = (num, fill) => {
	let len = ('' + num).length;
	return Array(fill > len ? fill - len + 1 || 0 : 0).join(0) + num;
};

const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getDateTimeMillisec = () => {
	let date = new Date(),
		m = padNumber(date.getMonth() + 1, 2),
		d = padNumber(date.getDate(), 2),
		hour = padNumber(date.getHours(), 2),
		min = padNumber(date.getMinutes(), 2),
		sec = padNumber(date.getSeconds(), 2),
		millisec = date.getMilliseconds().toString().substring(0, 2);
	return `${m}/${d} ${hour}:${min}:${sec}:${millisec}`;
};

const getDay = () => {
	let date = new Date(),
		day = week[date.getDay()],
		m = month[date.getMonth()],
		d = padNumber(date.getDate(), 2);
	return `${day}, ${m} ${d}`;
};

const getDateTime = () => {
	let date = new Date(),
		m = padNumber(date.getMonth() + 1, 2),
		d = padNumber(date.getDate(), 2),
		hour = padNumber(date.getHours(), 2),
		min = padNumber(date.getMinutes(), 2),
		sec = padNumber(date.getSeconds(), 2);
	return `${m}/${d} ${hour}:${min}:${sec}`;
};

const getTime = () => {
	let date = new Date(),
		hour = padNumber(date.getHours(), 2),
		min = padNumber(date.getMinutes(), 2),
		sec = padNumber(date.getSeconds(), 2);
	return ` ${hour}:${min}:${sec}`;
};

const getTimeMillisec = () => {
	let date = new Date(),
		hour = padNumber(date.getHours(), 2),
		min = padNumber(date.getMinutes(), 2),
		sec = padNumber(date.getSeconds(), 2),
		millisec = date.getMilliseconds().toString().substring(0, 2);
	return ` ${hour}:${min}:${sec}:${millisec}`;
};

const fullscreen = () => {
	let fs = document.fullscreenElement && document.fullscreenElement !== null;

	var docElm = document.documentElement;
	if (!fs) {
		if (docElm.requestFullscreen) {
			docElm.requestFullscreen();
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		}
	}
	fs = !fs;
	return fs;
};

const exitFullscreen = () => {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	}
};

const getVideoFrame = (videoElement) => {
	const canvasElement = document.createElement('canvas');
	canvasElement.width = videoElement.videoWidth;
	canvasElement.height = videoElement.videoHeight;
	const canvasContext = canvasElement.getContext('2d');
	canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
	return canvasElement;
};

const getInputTensor = (inputElement, inputOptions) => {
	const inputDimensions = inputOptions.inputDimensions;
	const tensor = new Float32Array(inputDimensions.slice(1).reduce((a, b) => a * b));

	inputElement.width =
		inputElement.videoWidth || inputElement.naturalWidth || inputElement.displayWidth;
	inputElement.height =
		inputElement.videoHeight || inputElement.naturalHeight || inputElement.displayHeight;

	let [channels, height, width] = inputDimensions.slice(1);
	const mean = inputOptions.mean || [0, 0, 0, 0];
	const std = inputOptions.std || [1, 1, 1, 1];
	const normlizationFlag = inputOptions.norm || false;
	const channelScheme = inputOptions.channelScheme || 'RGB';
	const scaledFlag = inputOptions.scaledFlag || false;
	const inputLayout = inputOptions.inputLayout;
	const imageChannels = 4; // RGBA
	const drawOptions = inputOptions.drawOptions;
	if (inputLayout === 'nhwc') {
		[height, width, channels] = inputDimensions.slice(1);
	}
	const canvasElement = document.createElement('canvas');
	canvasElement.width = width;
	canvasElement.height = height;
	const canvasContext = canvasElement.getContext('2d');

	if (drawOptions) {
		canvasContext.drawImage(
			inputElement,
			drawOptions.sx,
			drawOptions.sy,
			drawOptions.sWidth,
			drawOptions.sHeight,
			0,
			0,
			drawOptions.dWidth,
			drawOptions.dHeight
		);
	} else {
		if (scaledFlag) {
			const resizeRatio = Math.max(
				Math.max(inputElement.width / width, inputElement.height / height),
				1
			);
			const scaledWidth = Math.floor(inputElement.width / resizeRatio);
			const scaledHeight = Math.floor(inputElement.height / resizeRatio);
			canvasContext.drawImage(inputElement, 0, 0, scaledWidth, scaledHeight);
		} else {
			canvasContext.drawImage(inputElement, 0, 0, width, height);
		}
	}

	let pixels = canvasContext.getImageData(0, 0, width, height).data;

	if (normlizationFlag) {
		pixels = new Float32Array(pixels).map((p) => p / 255);
	}

	for (let c = 0; c < channels; ++c) {
		for (let h = 0; h < height; ++h) {
			for (let w = 0; w < width; ++w) {
				let value;
				if (channelScheme === 'BGR') {
					value = pixels[h * width * imageChannels + w * imageChannels + (channels - c - 1)];
				} else {
					value = pixels[h * width * imageChannels + w * imageChannels + c];
				}
				if (inputLayout === 'nchw') {
					tensor[c * width * height + h * width + w] = (value - mean[c]) / std[c];
				} else {
					tensor[h * width * channels + w * channels + c] = (value - mean[c]) / std[c];
				}
			}
		}
	}
	return tensor;
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

const median = (arr, length) => {
	if (arr.length == 0) {
		return;
	}
	const sorted = arr.sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	if (sorted.length % 2 === 0) {
		let evenSum = 0;
		if (length === 0) {
			evenSum = parseInt(sorted[middle - 1]) + parseInt(sorted[middle]);
		} else if (length === 2) {
			evenSum = parseFloat(sorted[middle - 1]) + parseFloat(sorted[middle]);
		}
		return (evenSum / 2.0).toFixed(length);
	} else {
		return sorted[middle];
	}
};

const geometricMean = (arr, n, length) => {
	// declare product variable and
	// initialize it to 1.
	let product = 1;

	// Compute the product of all the
	// elements in the array.
	for (let i = 0; i < n; i++) product = product * arr[i];

	// compute geometric mean through
	// formula pow(product, 1/n) and
	// return the value to main function.
	let gm = Math.pow(product, 1 / n);
	gm = gm.toFixed(length);
	return gm;
};

// var EPSILON = 0.000001;

// const fp_less_than = (A, B, Epsilon) => {
// 	Epsilon = Epsilon || EPSILON;
// 	return A - B < Epsilon && Math.abs(A - B) > Epsilon;
// };

// const fp_greater_than = (A, B, Epsilon) => {
// 	Epsilon = Epsilon || EPSILON;
// 	return A - B > Epsilon && Math.abs(A - B) > Epsilon;
// };

export {
	initials,
	cl,
	videoObject,
	week,
	month,
	padNumber,
	getDateTime,
	getDateTimeMillisec,
	getTime,
	getTimeMillisec,
	getDay,
	fullscreen,
	exitFullscreen,
	getVideoFrame,
	getInputTensor,
	median,
	geometricMean,
	verifyMediaStreamTrack
};
