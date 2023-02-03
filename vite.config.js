import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';
import { cert, certkey } from './restserver/config';

const config = {
	server: {
		https: {
			cert: fs.readFileSync(cert),
			key: fs.readFileSync(certkey)
		}
	},
	plugins: [sveltekit()]
};

export default config;
