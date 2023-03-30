const bgList = [
	'00.jpg',
	'01.jpg',
	'02.jpg',
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

export { bgList, inputOptions, modelConfigs };
