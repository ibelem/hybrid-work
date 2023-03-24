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

const urlFilter = () => {};

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
	urlFilter
};
