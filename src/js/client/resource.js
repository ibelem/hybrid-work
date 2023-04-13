const bgList = [
	'00.jpg',
	'01.jpg',
	'02.jpg',
	'03-1.jpg',
	'03.jpg',
	'04.jpg',
	'05.jpg',
	'06.jpg',
	'07.jpg',
	'08.jpg',
	'09.jpg',
	'10.jpg',
	'11.jpg'
];

const inputOptions = {
	mean: [127.5, 127.5, 127.5],
	std: [127.5, 127.5, 127.5],
	scaledFlag: false,
	inputLayout: 'nhwc'
};

const modelConfigs = [
	{
		id: 1,
		name: 'Selfie Segmentation',
		inputDimensions: [1, 256, 256, 3],
		inputResolution: [256, 256],
		modelPath: '../../models/selfie_segmentation.tflite'
	},
	{
		id: 2,
		name: 'Selfie Segmentation Landscape',
		inputDimensions: [1, 144, 256, 3],
		inputResolution: [256, 144],
		modelPath: '../../models/selfie_segmentation_landscape.tflite'
	},
	{
		id: 3,
		name: 'DeepLab v3',
		inputDimensions: [1, 257, 257, 3],
		inputResolution: [257, 257],
		modelPath: '../../models/lite-model_deeplabv3_1_metadata_2.tflite'
	}
];

// SD 720x480, HD 1280x720 , Full HD: 1920x1280,
// 2K 2048 x 1080, QHD 2560 x 1440, 4K 3840 x 2160 8K 7680 x 4320

const resolutionSet = [
	{ id: 1, width: 360, height: 240, name: 'WQVGA' },
	{ id: 2, width: 480, height: 320, name: 'HVGA' },
	{ id: 3, width: 720, height: 480, name: 'SD WVGA' },
	{ id: 4, width: 1280, height: 720, name: 'HD WXGA' },
	{ id: 5, width: 1920, height: 1280, name: 'Full HD', note: 'Not Supported' },
	{ id: 6, width: 2048, height: 1080, name: '2K', note: 'Not Supported' },
	{ id: 7, width: 2560, height: 1440, name: 'QHD', note: 'Not Supported' },
	{ id: 8, width: 3840, height: 2160, name: '4K UHD', note: 'Not Supported' },
	{ id: 9, width: 7680, height: 4320, name: '8K UHD', note: 'Not Supported' }
];

export { bgList, inputOptions, modelConfigs, resolutionSet };
