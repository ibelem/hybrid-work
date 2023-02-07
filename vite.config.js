import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('config.json', import.meta.url));
const json = JSON.parse(readFileSync(file, 'utf8'));

const config = {
	server: {
		https: {
			cert: fs.readFileSync(json.cert),
			key: fs.readFileSync(json.certkey)
		}
	},
	plugins: [sveltekit()]
};

export default config;
