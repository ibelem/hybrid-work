import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('config.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

const config = {
	server: {
		https: {
			cert: fs.readFileSync(pkg.cert),
			key: fs.readFileSync(pkg.certkey)
		}
	},
	plugins: [sveltekit()]
};

export default config;
